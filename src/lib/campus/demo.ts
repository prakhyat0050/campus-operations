import { normalizeCampusRole, type CampusRole } from './access';
import { makeSeed, type RecordItem } from './data';
import type { CampusProfile } from './profile';

const DEMO_MODE_KEY = 'campus-demo-mode';
const DEMO_PROFILE_KEY = 'campus-demo-profile';
const DEMO_RECORDS_KEY = 'campus-demo-records-v1';

export function isCampusDemoMode(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function getCampusDemoProfile(): CampusProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(DEMO_PROFILE_KEY);
  if (!stored) return null;

  const parsed: unknown = JSON.parse(stored);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Saved demo profile is invalid. Clear this browser’s campus demo data and try again.');
  }

  const profile = parsed as Partial<CampusProfile>;
  if (profile.user_id !== 'local-demo-user' || typeof profile.role !== 'string') {
    throw new Error('Saved demo profile is invalid. Clear this browser’s campus demo data and try again.');
  }

  return {
    user_id: 'local-demo-user',
    display_name: typeof profile.display_name === 'string' ? profile.display_name : 'Campus Demo User',
    email: null,
    role: normalizeCampusRole(profile.role),
  };
}

export function startCampusDemo(role: CampusRole): CampusProfile {
  if (typeof window === 'undefined') {
    throw new Error('Demo workspace can only be started in a browser.');
  }

  const profile: CampusProfile = {
    user_id: 'local-demo-user',
    display_name: 'Campus Demo User',
    email: null,
    role,
  };
  window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(DEMO_MODE_KEY, 'true');
  return profile;
}

export function saveCampusDemoProfile(profile: CampusProfile): CampusProfile {
  if (!isCampusDemoMode()) {
    throw new Error('The local demo profile can only be saved in demo mode.');
  }

  const saved = { ...profile, user_id: 'local-demo-user', email: null };
  window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(saved));
  return saved;
}

export function endCampusDemo(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_MODE_KEY);
  window.localStorage.removeItem(DEMO_PROFILE_KEY);
}

export function loadCampusDemoRecords(): RecordItem[] {
  if (typeof window === 'undefined') return makeSeed();
  const stored = window.localStorage.getItem(DEMO_RECORDS_KEY);
  if (!stored) {
    const seeded = makeSeed();
    saveCampusDemoRecords(seeded);
    return seeded;
  }

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved demo records are invalid. Clear this browser’s campus demo data and try again.');
  }
  return parsed as RecordItem[];
}

export function saveCampusDemoRecords(records: RecordItem[]): void {
  if (typeof window === 'undefined') {
    throw new Error('Demo records can only be saved in a browser.');
  }
  window.localStorage.setItem(DEMO_RECORDS_KEY, JSON.stringify(records));
}
