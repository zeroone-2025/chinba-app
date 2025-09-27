import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  addParticipantsToCurrentTeam: (participants: Participant[]) => void
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

export const useClubStore = create<ClubState>()(
  persist(
    (set, get) => ({
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
  },
  // 현재 선택된 팀에 새로운 참가자들 추가
  addParticipantsToCurrentTeam: (participants: Participant[]) => set((state) => {
    console.log('=== addParticipantsToCurrentTeam 시작 ===');
    console.log('현재 선택된 팀:', state.selectedTeam?.team.teamName);
    console.log('현재 팀 참가자 수:', state.selectedTeam?.team.participants.length);
    console.log('추가할 참가자들:', participants.map(p => ({ id: p.id, name: p.name })));

    if (!state.selectedTeam) {
      console.error('선택된 팀이 없음');
      return state;
    }

    const updatedClubs = state.clubs.map(club => {
      if (club.name !== state.selectedTeam!.club) return club;

      const updatedTeams = club.teams.map(team => {
        if (team.teamId !== state.selectedTeam!.team.teamId) return team;

        console.log('기존 팀 참가자 수:', team.participants.length);
        console.log('기존 팀 크기:', team.teamSize);

        // 기존 참가자 ID들을 확인하여 중복 방지
        const existingIds = team.participants.map(p => p.id);
        const newParticipants = participants.filter(p => !existingIds.includes(p.id));

        console.log('중복 제거 후 새 참가자 수:', newParticipants.length);

        const updatedTeam = {
          ...team,
          participants: [...team.participants, ...newParticipants],
          teamSize: team.participants.length + newParticipants.length
        };

        console.log('업데이트된 팀 참가자 수:', updatedTeam.participants.length);
        console.log('업데이트된 팀 크기:', updatedTeam.teamSize);

        return updatedTeam;
      });

      return { ...club, teams: updatedTeams };
    });

    // selectedTeam도 업데이트
    const updatedSelectedTeam = updatedClubs
      .find(club => club.name === state.selectedTeam!.club)
      ?.teams.find(team => team.teamId === state.selectedTeam!.team.teamId);

    console.log('업데이트된 선택 팀:', updatedSelectedTeam);

    const newState = {
      ...state,
      clubs: updatedClubs,
      selectedTeam: updatedSelectedTeam ? {
        club: state.selectedTeam.club,
        team: updatedSelectedTeam
      } : state.selectedTeam
    };

    console.log('=== addParticipantsToCurrentTeam 완료 ===');
    console.log('업데이트된 팀 참가자 수:', newState.selectedTeam?.team.participants.length);
    console.log('새로운 참가자들:', newState.selectedTeam?.team.participants.map(p => p.name));
    return newState;
  })
}),
{
  name: 'club-store',
  partialize: (state) => ({
    clubs: state.clubs,
    selectedTeam: state.selectedTeam,
    selectedParticipants: state.selectedParticipants,
    personalSchedulesByMember: state.personalSchedulesByMember
  })
}
))