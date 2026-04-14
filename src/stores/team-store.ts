import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'sentire.surgicalTeam.v1';

/**
 * Common roles for a Sentire robotic-surgery OR. Users can also enter a
 * free-form role when picking "Other" in the UI, so this list is just a
 * convenience, not an enum.
 */
export const DEFAULT_TEAM_ROLES = [
  'Console Surgeon',
  'Patient-side Surgeon',
  'Assistant',
  'Scrub Nurse',
  'Circulating Nurse',
  'Anesthesiologist',
  'CRNA / Anesthetist',
  'Perfusionist',
  'Observer',
] as const;

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  /** Free-text notes (optional): pager, preferences, etc. */
  notes?: string;
}

function load(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeamMember[]) : [];
  } catch {
    return [];
  }
}

function persist(members: TeamMember[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    // ignore
  }
}

interface TeamState {
  members: TeamMember[];
  addMember: (spec: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, patch: Partial<Omit<TeamMember, 'id'>>) => void;
  removeMember: (id: string) => void;
  /** Move a member from one index to another (for drag-to-reorder). */
  moveMember: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  members: load(),
  addMember: (spec) =>
    set((state) => {
      const member: TeamMember = { ...spec, id: uuidv4() };
      const next = [...state.members, member];
      persist(next);
      return { members: next };
    }),
  updateMember: (id, patch) =>
    set((state) => {
      const next = state.members.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      );
      persist(next);
      return { members: next };
    }),
  removeMember: (id) =>
    set((state) => {
      const next = state.members.filter((m) => m.id !== id);
      persist(next);
      return { members: next };
    }),
  moveMember: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.members.length ||
        toIndex >= state.members.length
      ) {
        return state;
      }
      const next = [...state.members];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persist(next);
      return { members: next };
    }),
  clearAll: () => {
    persist([]);
    set({ members: [] });
  },
}));
