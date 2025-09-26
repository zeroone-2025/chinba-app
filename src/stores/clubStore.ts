import { create } from 'zustand'

export interface Club {
  name: string
  teams: string[]
}

export interface SelectedTeam {
  club: string
  team: string
}

interface ClubState {
  clubs: Club[]
  openClubs: string[]
  selectedTeam: SelectedTeam | null
  toggleClub: (clubName: string) => void
  selectTeam: (club: string, team: string) => void
}

export const useClubStore = create<ClubState>()((set) => ({
  clubs: [
    {
      name: '개발 동아리',
      teams: ['1팀', '2팀', '3팀']
    },
    {
      name: '디자인 동아리',
      teams: ['1팀', '2팀', '3팀']
    },
    {
      name: '기획 동아리',
      teams: ['1팀', '2팀', '3팀']
    }
  ],
  openClubs: ['개발 동아리', '디자인 동아리', '기획 동아리'],
  selectedTeam: {
    club: '개발 동아리',
    team: '1팀'
  },
  toggleClub: (clubName: string) => set((state) => ({
    openClubs: state.openClubs.includes(clubName)
      ? state.openClubs.filter((name) => name !== clubName)
      : [...state.openClubs, clubName]
  })),
  selectTeam: (club: string, team: string) => set(() => ({
    selectedTeam: { club, team }
  }))
}))