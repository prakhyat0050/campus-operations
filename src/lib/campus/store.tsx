import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { statuses, type RecordItem } from './data';
import { addRecordNote, advanceRecordStatus, campusRecordsOptions, submitRecord } from './records';
import { canPerformAction, type CampusRole } from './access';
import { syncCampusProfile, type CampusProfile } from './profile';

type NewRecord = Omit<RecordItem, 'id' | 'history'>;
type Store = { items: RecordItem[]; loading: boolean; loadError: string | null; refresh: () => void; add: (item: NewRecord) => Promise<void>; advance: (id: string) => void; note: (id: string, note: string) => void; simulate: (scenario: string) => void; read: string[]; markRead: () => void; role: CampusRole; profile: CampusProfile; setRole: (role: CampusRole) => Promise<void>; saveDisplayName: (name: string) => Promise<void> };

const Context = createContext<Store | null>(null);

export function CampusProvider({ children, profile: initialProfile, onProfileChange }: { children: ReactNode; profile: CampusProfile; onProfileChange: (profile: CampusProfile) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(campusRecordsOptions);
  const [read, setRead] = useState<string[]>([]);
  const [profile, setProfile] = useState(initialProfile);
  const role = profile.role;
  const items = data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: campusRecordsOptions.queryKey });
  const fail = (fallback: string) => (error: unknown) => toast.error(error instanceof Error ? error.message : fallback);
  useEffect(() => setProfile(initialProfile), [initialProfile]);
  const saveProfile = async (changes: { role?: CampusRole; display_name?: string | null }) => {
    const saved = await syncCampusProfile({
      role: changes.role ?? profile.role,
      displayName: changes.display_name ?? profile.display_name,
      email: profile.email,
    });
    if (!saved) throw new Error('Your campus profile could not be saved.');
    setProfile(saved);
    onProfileChange(saved);
    return saved;
  };
  const setRole = async (nextRole: CampusRole) => {
    try {
      await saveProfile({ role: nextRole });
      toast.success('Campus role updated');
    } catch (error) {
      fail('Campus role could not be updated')(error);
      throw error;
    }
  };
  const saveDisplayName = async (name: string) => {
    try {
      await saveProfile({ display_name: name.trim() || null });
      toast.success('Profile updated');
    } catch (error) {
      fail('Profile could not be updated')(error);
      throw error;
    }
  };

  const create = useMutation({
    mutationFn: ({ item, note }: { item: NewRecord; note: string }) => submitRecord(item, note),
    onSuccess: () => { refresh(); toast.success('Report submitted successfully'); },
    onError: fail('Report could not be saved'),
  });
  const move = useMutation({
    mutationFn: advanceRecordStatus,
    onSuccess: () => { refresh(); toast.success('Request status updated'); },
    onError: fail('Request status could not be updated'),
  });
  const annotate = useMutation({
    mutationFn: addRecordNote,
    onSuccess: () => { refresh(); toast.success('Note added'); },
    onError: fail('Note could not be saved'),
  });
  const add = async (item: NewRecord) => {
    if (!canPerformAction(role, 'create_report')) {
      toast.error('Your role does not have permission to create campus records.');
      return;
    }
    await create.mutateAsync({ item, note: 'Report created' });
  };

  const advance = (id: string) => {
    if (!canPerformAction(role, 'advance_ticket')) {
      toast.error('Only a manager or security lead can update ticket statuses.');
      return;
    }
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;
    const index = statuses.indexOf(item.status);
    const status = statuses[Math.min(index + 1, statuses.length - 1)] ?? item.status;
    if (status === item.status) return;
    move.mutate({ id, status, team: item.team || (index === 0 ? 'Facilities Manager' : ''), note: `${status} by ${role}` });
  };

  const note = (id: string, text: string) => {
    if (!text.trim()) return;
    if (!canPerformAction(role, 'edit_ticket')) {
      toast.error('Your role cannot add notes to campus tickets.');
      return;
    }
    annotate.mutate({ id, note: text.trim().slice(0, 500) });
  };

  const simulate = (scenario: string) => {
    if (!canPerformAction(role, 'create_report')) {
      toast.error('Your current role cannot simulate a campus event.');
      return;
    }
    if (scenario === 'resolution') {
      const item = items.find((candidate) => candidate.kind === 'maintenance' && candidate.status !== 'Resolved');
      if (item) advance(item.id);
      return;
    }
    const team = scenario === 'security' ? 'Security Manager' : 'Facilities Manager';
    const base: NewRecord = scenario === 'water'
      ? { title: 'Simulated pipe leakage', description: 'Reading 9,600 L versus 8,000 L baseline (+20%). Inspect pipework.', building: 'academic', category: 'Plumbing', priority: 'Critical', kind: 'maintenance', status: 'Reported', team }
      : scenario === 'energy'
        ? { title: 'Simulated energy anomaly', description: 'Observed 3,800 kWh compared with 2,860 kWh baseline (+32.9%). Inspect lab equipment.', building: 'science', category: 'Electrical', priority: 'High', kind: 'maintenance', status: 'Reported', team }
        : { title: 'Simulated suspicious login pattern', description: '8 failed logins in 10 minutes exceeds threshold of 5. Review access logs.', building: 'admin', category: 'Access control', priority: 'High', kind: 'security', status: 'Reported', team };
    void add(base);
    if (scenario === 'water') void add({ ...base, title: 'Community report: pipe leakage', kind: 'community', priority: 'High', team: 'Plumbing team' });
  };

  return <Context.Provider value={{ items, loading: isLoading, loadError: error instanceof Error ? error.message : error ? 'Campus reports could not be loaded. Please try again.' : null, refresh: () => { void refresh(); }, add, advance, note, simulate, read, markRead: () => setRead(items.map((item) => item.id)), role, profile, setRole, saveDisplayName }}>{children}</Context.Provider>;
}

export function useCampus() { const ctx = useContext(Context); if (!ctx) throw new Error('Campus provider is missing'); return ctx; }
