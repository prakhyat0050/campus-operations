import { afterEach, describe, expect, it } from 'vitest';
import {
  endCampusDemo,
  getCampusDemoProfile,
  isCampusDemoMode,
  loadCampusDemoRecords,
  saveCampusDemoProfile,
  saveCampusDemoRecords,
  startCampusDemo,
} from '@/lib/campus/demo';
import { makeSeed } from '@/lib/campus/data';
import { addRecordNote, advanceRecordStatus, submitRecord } from '@/lib/campus/records';

afterEach(() => {
  window.localStorage.clear();
});

describe('local campus demo', () => {
  it('starts with a selected local-only role and restores it on reload', () => {
    const profile = startCampusDemo('Facilities Manager');

    expect(isCampusDemoMode()).toBe(true);
    expect(profile.user_id).toBe('local-demo-user');
    expect(profile.role).toBe('Facilities Manager');
    expect(getCampusDemoProfile()).toEqual(profile);
  });

  it('persists profile and seeded records only in browser storage', () => {
    startCampusDemo('Student');
    const profile = getCampusDemoProfile();
    if (!profile) throw new Error('Expected the local demo profile to be available.');

    expect(saveCampusDemoProfile({ ...profile, display_name: 'Demo Student' }).display_name).toBe('Demo Student');
    expect(loadCampusDemoRecords()).toEqual(makeSeed());
    const changed = makeSeed().slice(1);
    saveCampusDemoRecords(changed);
    expect(loadCampusDemoRecords()).toEqual(changed);
  });

  it('exits demo mode without erasing the browser’s saved workspace records', () => {
    startCampusDemo('Super Admin');
    const records = loadCampusDemoRecords();

    endCampusDemo();

    expect(isCampusDemoMode()).toBe(false);
    expect(getCampusDemoProfile()).toBeNull();
    expect(loadCampusDemoRecords()).toEqual(records);
  });

  it('creates and updates records locally while retaining role restrictions', async () => {
    startCampusDemo('Super Admin');
    const [seed] = makeSeed();
    if (!seed) throw new Error('Expected a sample record.');

    await submitRecord({
      title: 'Demo maintenance request',
      description: 'A local-only test report.',
      building: seed.building,
      category: 'Testing',
      priority: 'Low',
      status: 'Reported',
      team: 'Campus Operations',
      kind: 'maintenance',
    });
    const created = loadCampusDemoRecords().find((record) => record.title === 'Demo maintenance request');
    if (!created) throw new Error('Expected the demo record to be stored locally.');

    await advanceRecordStatus({ id: created.id, status: 'Under Review', team: created.team, note: 'Review started' });
    await addRecordNote({ id: created.id, note: 'Local note added' });

    const updated = loadCampusDemoRecords().find((record) => record.id === created.id);
    expect(updated?.status).toBe('Under Review');
    expect(updated?.history.at(-1)).toContain('Local note added');

    const profile = getCampusDemoProfile();
    if (!profile) throw new Error('Expected the demo profile to be available.');
    saveCampusDemoProfile({ ...profile, role: 'Student' });
    await expect(advanceRecordStatus({ id: created.id, status: 'Assigned', team: created.team, note: 'Not allowed' }))
      .rejects.toThrow('ticket updates permission');
  });
});
