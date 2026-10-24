import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { assertCampusPermission, getDefaultAssignedTeam, normalizeCampusRole, resolveAuthRole, type CampusRole } from './access';
import { makeSeed, sampleMinutesAgo, sampleNotes, type Priority, type RecordItem, type Status } from './data';
import { getCampusDemoProfile, isCampusDemoMode, loadCampusDemoRecords, saveCampusDemoRecords } from './demo';

type Kind = RecordItem['kind'];
type NewRecord = Omit<RecordItem, 'id' | 'history'>;

type RecordRow = {
  ref_code: string;
  kind: Kind;
  title: string;
  description: string;
  building: string;
  category: string;
  priority: Priority;
  status: Status;
  team: string;
  photo: string | null;
  created_at: string;
};

type EventRow = { record_ref: string; note: string; created_at: string };

type WriteResult = { ok: true } | { ok: false; duplicate: boolean; message: string };

export const campusRecordsKey = ['campus-records'] as const;

// Turns a stored timeline entry into the short label shown in the activity list.
export function formatActivity(note: string, createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return note;

  const msSince = Date.now() - date.getTime();
  const label = msSince < 24 * 60 * 60 * 1000
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : msSince < 48 * 60 * 60 * 1000
      ? 'Yesterday'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return `${label} · ${note}`;
}

export function newRefCode(kind: Kind) {
  const prefix = kind === 'community' ? 'CR' : kind === 'security' ? 'SC' : 'MT';
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}

async function loadCampusRecords(): Promise<RecordItem[]> {
  if (isCampusDemoMode()) return loadCampusDemoRecords();

  const records = await supabase
    .from('campus_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (records.error) throw new Error(`Shared campus data could not be loaded. ${records.error.message}`);
  const rows = (records.data ?? []) as unknown as RecordRow[];

  let events: EventRow[] = [];
  if (rows.length) {
    const timeline = await supabase
      .from('campus_record_events')
      .select('record_ref, note, created_at')
      .in('record_ref', rows.map((row) => row.ref_code))
      .order('created_at', { ascending: true })
      .limit(5000);
    if (timeline.error) throw new Error(`Activity timelines could not be loaded. ${timeline.error.message}`);
    events = (timeline.data ?? []) as unknown as EventRow[];
  }

  return rows.map((row) => ({
    id: row.ref_code,
    title: row.title,
    description: row.description,
    building: row.building,
    category: row.category,
    priority: row.priority,
    status: row.status,
    team: row.team,
    kind: row.kind,
    ...(row.photo ? { photo: row.photo } : {}),
    history: events
      .filter((event) => event.record_ref === row.ref_code)
      .map((event) => formatActivity(event.note, event.created_at)),
  }));
}

// Every screen reads the same shared records. Sample data is reserved for explicit demo restoration.
export const campusRecordsOptions = queryOptions({
  queryKey: campusRecordsKey,
  queryFn: loadCampusRecords,
  staleTime: 5_000,
  refetchInterval: 15_000,
});

async function getCurrentCampusRole(): Promise<CampusRole> {
  if (isCampusDemoMode()) {
    const profile = getCampusDemoProfile();
    if (!profile) throw new Error('The local campus demo profile is missing. Return to sign-in and enter demo mode again.');
    return profile.role;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('You must be signed in to manage campus records.');
  }

  const { data: profile } = await supabase
    .from('campus_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return normalizeCampusRole(profile?.role ?? resolveAuthRole(user.user_metadata));
}

async function insertRow(item: NewRecord, refCode: string, note: string, minutesAgo = 0): Promise<WriteResult> {
  const currentRole = await getCurrentCampusRole();
  assertCampusPermission(currentRole, 'create_report', 'Creating a campus report');

  const assignedTeam = (item.team || getDefaultAssignedTeam(currentRole)).trim();
  const createdAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  if (isCampusDemoMode()) {
    const records = loadCampusDemoRecords();
    if (records.some((record) => record.id === refCode)) {
      return { ok: false, duplicate: true, message: 'A demo record with this reference already exists.' };
    }
    saveCampusDemoRecords([{
      ...item,
      id: refCode,
      team: assignedTeam,
      history: [formatActivity(note, createdAt)],
    }, ...records]);
    return { ok: true };
  }

  const inserted = await supabase.from('campus_records').insert({
    ref_code: refCode,
    kind: item.kind,
    title: item.title,
    description: item.description,
    building: item.building,
    category: item.category,
    priority: item.priority,
    status: item.status,
    team: assignedTeam,
    photo: item.photo ?? null,
    created_at: createdAt,
  }).select('ref_code').single();
  if (inserted.error) {
    return {
      ok: false,
      duplicate: inserted.error.code === '23505',
      message: `Report could not be saved. ${inserted.error.message}`,
    };
  }
  if (inserted.data.ref_code !== refCode) {
    return { ok: false, duplicate: false, message: 'The database did not confirm that this report was saved. Please try again.' };
  }
  const timeline = await supabase.from('campus_record_events').insert({
    record_ref: refCode,
    note,
    created_at: createdAt,
  });
  if (timeline.error) {
    return { ok: false, duplicate: false, message: `Report saved, but its timeline could not. ${timeline.error.message}` };
  }
  return { ok: true };
}

function ensureWritten(result: WriteResult) {
  if (!result.ok) throw new Error(result.message);
}

export async function submitRecord(item: NewRecord, note = 'Report created') {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await insertRow(item, newRefCode(item.kind), note);
    if (result.ok) return;
    if (!result.duplicate) throw new Error(result.message);
  }
  throw new Error('Report could not be saved. Please try again.');
}

export async function advanceRecordStatus({ id, status, team, note }: { id: string; status: Status; team: string; note: string }) {
  const currentRole = await getCurrentCampusRole();
  assertCampusPermission(currentRole, 'advance_ticket', 'Updating a campus ticket');

  const assignedTeam = (team || getDefaultAssignedTeam(currentRole)).trim();
  if (isCampusDemoMode()) {
    const records = loadCampusDemoRecords();
    const updated = records.map((record) => record.id === id
      ? { ...record, status, team: assignedTeam, history: [...record.history, formatActivity(note, new Date().toISOString())] }
      : record);
    if (!records.some((record) => record.id === id)) throw new Error('Campus record could not be found.');
    saveCampusDemoRecords(updated);
    return id;
  }

  const updated = await supabase.from('campus_records').update({ status, team: assignedTeam }).eq('ref_code', id);
  if (updated.error) throw new Error(`Request status could not be updated. ${updated.error.message}`);
  const timeline = await supabase.from('campus_record_events').insert({ record_ref: id, note });
  if (timeline.error) throw new Error(`Status updated, but its timeline could not. ${timeline.error.message}`);
  return id;
}

export async function addRecordNote({ id, note }: { id: string; note: string }) {
  const currentRole = await getCurrentCampusRole();
  assertCampusPermission(currentRole, 'edit_ticket', 'Adding a campus note');

  if (isCampusDemoMode()) {
    const records = loadCampusDemoRecords();
    let found = false;
    const updated = records.map((record) => {
      if (record.id !== id) return record;
      found = true;
      return { ...record, history: [...record.history, formatActivity(note, new Date().toISOString())] };
    });
    if (!found) throw new Error('Campus record could not be found.');
    saveCampusDemoRecords(updated);
    return id;
  }

  const timeline = await supabase.from('campus_record_events').insert({ record_ref: id, note });
  if (timeline.error) throw new Error(`Note could not be saved. ${timeline.error.message}`);
  return id;
}

// Restores the fictional sample campus for the whole shared demo.
export async function restoreSampleCampus() {
  if (isCampusDemoMode()) {
    saveCampusDemoRecords(makeSeed());
    return;
  }

  const cleared = await supabase.from('campus_records').delete().neq('ref_code', '');
  if (cleared.error) throw new Error(`Sample campus could not be restored. ${cleared.error.message}`);
  for (const item of makeSeed()) {
    const notes = sampleNotes[item.id] ?? ['Report created'];
    ensureWritten(await insertRow(item, item.id, notes[0] ?? 'Report created', sampleMinutesAgo[item.id] ?? 0));
    for (const note of notes.slice(1)) {
      const timeline = await supabase.from('campus_record_events').insert({ record_ref: item.id, note });
      if (timeline.error) throw new Error(`Sample campus could not be restored. ${timeline.error.message}`);
    }
  }
}
