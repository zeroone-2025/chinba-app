import { create } from 'zustand'
import timetablesData from './timetables.json'

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
  toggleClub: (clubName: string) => void
  selectTeam: (club: string, team: Team) => void
  setSelectedParticipants: (teamId: string, participantIds: string[]) => void
  getSelectedParticipants: (teamId: string) => string[]
}

// Transform timetables data to club structure
const transformTimetablesToClubs = (): Club[] => {
  const teamsArray = Object.values(timetablesData)

  return [
    {
      name: '개발 동아리',
      teams: teamsArray
    },
    {
      name: '디자인 동아리',
      teams: []
    },
    {
      name: '기획 동아리',
      teams: []
    }
  ]
}

export const useClubStore = create<ClubState>()((set, get) => ({
  clubs: transformTimetablesToClubs(),
  openClubs: ['개발 동아리', '디자인 동아리', '기획 동아리'],
  selectedTeam: {
    club: '개발 동아리',
    team: Object.values(timetablesData)[0]
  },
  selectedParticipants: {},
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
  }
}))