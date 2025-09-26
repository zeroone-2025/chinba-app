import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MohatActivity {
  id: string
  date: string
  title: string
  headcount: number
  description?: string
  imageUrl?: string
}

interface SelectedTeam {
  club: string
  team: string
}

interface MohatState {
  activities: MohatActivity[]
  addActivity: (activity: Omit<MohatActivity, 'id'>, selectedTeam: SelectedTeam) => void
  getActivities: (selectedTeam: SelectedTeam) => MohatActivity[]
  setSelectedTeam: (selectedTeam: SelectedTeam) => void
}

// Create a function to generate storage key based on club and team
const getStorageKey = (selectedTeam: SelectedTeam) =>
  `mohat.${selectedTeam.club}.${selectedTeam.team}`

// Create multiple store instances for different teams
const createTeamStore = (selectedTeam: SelectedTeam) => create<{ activities: MohatActivity[] }>()(
  persist(
    () => ({
      activities: [] as MohatActivity[]
    }),
    {
      name: getStorageKey(selectedTeam)
    }
  )
)

// Cache for team stores
const teamStores = new Map<string, ReturnType<typeof createTeamStore>>()

const getTeamStore = (selectedTeam: SelectedTeam) => {
  const key = getStorageKey(selectedTeam)
  if (!teamStores.has(key)) {
    teamStores.set(key, createTeamStore(selectedTeam))
  }
  return teamStores.get(key)!
}

export const useMohatStore = create<MohatState>()((set) => ({
  activities: [],

  addActivity: (activityData, selectedTeam) => {
    const newActivity = {
      ...activityData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }

    // Add to team-specific store
    const teamStore = getTeamStore(selectedTeam)
    teamStore.setState((state) => ({
      activities: [newActivity, ...state.activities]
    }))

    // Update current activities if this is the active team
    set((state) => ({
      ...state,
      activities: [newActivity, ...state.activities]
    }))
  },

  getActivities: (selectedTeam) => {
    const teamStore = getTeamStore(selectedTeam)
    return teamStore.getState().activities
  },

  setSelectedTeam: (selectedTeam) => {
    const teamStore = getTeamStore(selectedTeam)
    set({
      activities: teamStore.getState().activities
    })
  }
}))