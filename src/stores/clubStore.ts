import { create } from 'zustand'
import timetablesData from './timetables.json'
import type { PersonalSchedule } from '@/types'

// Centralized club names mapping
export const CLUB_NAMES = {
  dev: 'NextOne',
  design: 'ZeroOne',
  plan: 'Prior'
} as const

export type ClubKey = keyof typeof CLUB_NAMES

// Helper function to get club name
export function getClubName(key: ClubKey): string {
  return CLUB_NAMES[key]
}

// Helper function to get all club names
export function getAllClubNames(): string[] {
  return Object.values(CLUB_NAMES)
}

export interface Participant {
  id: string
  name: string
  timetable: Array<{
    subject: string
    location: string
    day: string
    time: string
  }>
}

export interface Team {
  teamId: string
  teamName: string
  groupName: string
  teamSize: number
  participants: Participant[]
}

export interface Club {
  name: string
  teams: Team[]
}

export interface SelectedTeam {
  club: string
  team: Team
}

interface ClubState {
  clubs: Club[]
  openClubs: string[]
  selectedTeam: SelectedTeam | null
  selectedParticipants: Record<string, string[]> // teamId -> participantIds
  personalSchedulesByMember: Record<string, PersonalSchedule[]> // memberId -> PersonalSchedule[]
  toggleClub: (clubName: string) => void
  selectTeam: (club: string, team: Team) => void
  setSelectedParticipants: (teamId: string, participantIds: string[]) => void
  getSelectedParticipants: (teamId: string) => string[]
  addPersonalSchedule: (memberId: string, schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => void
  removePersonalSchedule: (memberId: string, scheduleId: string) => void
  getPersonalSchedules: (memberId: string) => PersonalSchedule[]
}

// Transform timetables data to club structure
const transformTimetablesToClubs = (): Club[] => {
  const teamsArray: Team[] = Object.values(timetablesData).map((team) => ({
    ...team,
    groupName: team.clubName // Map clubName to groupName for Team interface compatibility
  }))

  return [
    {
      name: getClubName('dev'),
      teams: teamsArray
    },
    {
      name: getClubName('design'),
      teams: []
    },
    {
      name: getClubName('plan'),
      teams: []
    }
  ]
}

export const useClubStore = create<ClubState>()((set, get) => ({
  clubs: transformTimetablesToClubs(),
  openClubs: getAllClubNames(),
  selectedTeam: {
    club: getClubName('dev'),
    team: {
      ...Object.values(timetablesData)[0],
      groupName: Object.values(timetablesData)[0].clubName
    }
  },
  selectedParticipants: {},
  personalSchedulesByMember: {}, // 개인일정 상태 초기화
  toggleClub: (clubName: string) => set((state) => ({
    openClubs: state.openClubs.includes(clubName)
      ? state.openClubs.filter((name) => name !== clubName)
      : [...state.openClubs, clubName]
  })),
  selectTeam: (club: string, team: Team) => set(() => ({
    selectedTeam: { club, team }
  })),
  setSelectedParticipants: (teamId: string, participantIds: string[]) => set((state) => ({
    selectedParticipants: {
      ...state.selectedParticipants,
      [teamId]: participantIds
    }
  })),
  getSelectedParticipants: (teamId: string) => {
    const state = get();
    return state.selectedParticipants[teamId] || [];
  },
  // 개인일정 관리 액션들
  addPersonalSchedule: (memberId: string, schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => set((state) => {
    const newSchedule: PersonalSchedule = {
      ...schedule,
      id: crypto.randomUUID(),
      memberId
    };
    return {
      personalSchedulesByMember: {
        ...state.personalSchedulesByMember,
        [memberId]: [...(state.personalSchedulesByMember[memberId] || []), newSchedule]
      }
    };
  }),
  removePersonalSchedule: (memberId: string, scheduleId: string) => set((state) => ({
    personalSchedulesByMember: {
      ...state.personalSchedulesByMember,
      [memberId]: (state.personalSchedulesByMember[memberId] || []).filter(s => s.id !== scheduleId)
    }
  })),
  getPersonalSchedules: (memberId: string) => {
    const state = get();
    return state.personalSchedulesByMember[memberId] || [];
  }
}))