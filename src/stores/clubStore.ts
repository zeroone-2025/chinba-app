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
  globalParticipantCounter: number // 전역 참가자 ID 카운터
  toggleClub: (clubName: string) => void
  selectTeam: (club: string, team: Team) => void
  setSelectedParticipants: (teamId: string, participantIds: string[]) => void
  getSelectedParticipants: (teamId: string) => string[]
  addPersonalSchedule: (memberId: string, schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => void
  removePersonalSchedule: (memberId: string, scheduleId: string) => void
  getPersonalSchedules: (memberId: string) => PersonalSchedule[]
  addParticipantsToCurrentTeam: (participants: Participant[]) => void
  removeParticipantFromCurrentTeam: (participantId: string) => void
  getNextParticipantId: () => string
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
  globalParticipantCounter: 1000, // G1000부터 시작
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
    console.log('=== addPersonalSchedule 시작 ===');
    console.log('멤버 ID:', memberId);
    console.log('스케줄 데이터:', schedule);

    const newSchedule: PersonalSchedule = {
      ...schedule,
      id: crypto.randomUUID(),
      memberId
    };

    console.log('새 스케줄:', newSchedule);

    const updatedSchedules = {
      personalSchedulesByMember: {
        ...state.personalSchedulesByMember,
        [memberId]: [...(state.personalSchedulesByMember[memberId] || []), newSchedule]
      }
    };

    console.log('업데이트된 개인일정:', updatedSchedules.personalSchedulesByMember[memberId]);
    console.log('=== addPersonalSchedule 완료 ===');

    return updatedSchedules;
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
  }),
  // 현재 선택된 팀에서 참가자 삭제
  removeParticipantFromCurrentTeam: (participantId: string) => set((state) => {
    console.log('=== removeParticipantFromCurrentTeam 시작 ===');
    console.log('삭제할 참가자 ID:', participantId);
    console.log('현재 선택된 팀:', state.selectedTeam?.team.teamName);

    if (!state.selectedTeam) {
      console.error('선택된 팀이 없음');
      return state;
    }

    const updatedClubs = state.clubs.map(club => {
      if (club.name !== state.selectedTeam!.club) return club;

      const updatedTeams = club.teams.map(team => {
        if (team.teamId !== state.selectedTeam!.team.teamId) return team;

        console.log('삭제 전 참가자 수:', team.participants.length);

        // 해당 ID의 참가자 제거
        const updatedParticipants = team.participants.filter(p => p.id !== participantId);

        console.log('삭제 후 참가자 수:', updatedParticipants.length);

        return {
          ...team,
          participants: updatedParticipants,
          teamSize: updatedParticipants.length
        };
      });

      return { ...club, teams: updatedTeams };
    });

    // selectedTeam도 업데이트
    const updatedSelectedTeam = updatedClubs
      .find(club => club.name === state.selectedTeam!.club)
      ?.teams.find(team => team.teamId === state.selectedTeam!.team.teamId);

    // 해당 참가자의 개인일정도 삭제
    const updatedPersonalSchedules = { ...state.personalSchedulesByMember };
    delete updatedPersonalSchedules[participantId];

    // 선택된 참가자 목록에서도 제거
    const updatedSelectedParticipants = { ...state.selectedParticipants };
    Object.keys(updatedSelectedParticipants).forEach(teamId => {
      updatedSelectedParticipants[teamId] = updatedSelectedParticipants[teamId].filter(id => id !== participantId);
    });

    console.log('=== removeParticipantFromCurrentTeam 완료 ===');

    return {
      ...state,
      clubs: updatedClubs,
      selectedTeam: updatedSelectedTeam ? {
        club: state.selectedTeam.club,
        team: updatedSelectedTeam
      } : state.selectedTeam,
      personalSchedulesByMember: updatedPersonalSchedules,
      selectedParticipants: updatedSelectedParticipants
    };
  }),
  // 전역 고유 참가자 ID 생성
  getNextParticipantId: () => {
    const state = get();
    const newId = `G${String(state.globalParticipantCounter).padStart(3, '0')}`;
    set((state) => ({
      ...state,
      globalParticipantCounter: state.globalParticipantCounter + 1
    }));
    return newId;
  }
}),
{
  name: 'club-store',
  partialize: (state) => ({
    clubs: state.clubs,
    selectedTeam: state.selectedTeam,
    selectedParticipants: state.selectedParticipants,
    personalSchedulesByMember: state.personalSchedulesByMember,
    globalParticipantCounter: state.globalParticipantCounter
  })
}
))