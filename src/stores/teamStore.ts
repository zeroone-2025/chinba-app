import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import timetablesData from './timetables.json'

export type Ctx = { clubType: string; team: string }

const keyOf = (c: Ctx) => `${c.clubType}/${c.team}`

type TeamMeta = {
  members: number           // 팀 전체 인원(기본 10, 범위 4~20)
  activityCount: number     // 활동 횟수
  totalMinutes: number      // 총 참여시간(=duration 합)
  partSum: number           // 참여율 합(샘플 합)
  partSamples: number       // 참여율 샘플 개수
}

type State = {
  scores: Record<string, number>
  meta: Record<string, TeamMeta>
}

type Actions = {
  getScore: (c: Ctx) => number
  addScore: (c: Ctx, delta: number) => void
  setScore: (c: Ctx, score: number) => void
  getMeta: (c: Ctx) => TeamMeta & { avgParticipation: number }
  setMembers: (c: Ctx, n: number) => void
  addActivitySample: (c: Ctx, duration: number, participants: number) => void
  updateActivitySample: (c: Ctx, oldDuration: number, oldParticipants: number, newDuration: number, newParticipants: number) => void
  removeActivitySample: (c: Ctx, duration: number, participants: number) => void
  resetTeam: (c: Ctx) => void
  resetAll: () => void
}

export const parseKey = (k: string) => {
  const [clubType, team] = k.split('/')
  return { clubType, team }
}

export const selectByClub = (clubType: string) => (s: { scores: Record<string, number> }) =>
  Object.entries(s.scores)
    .map(([k, score]) => ({ ...parseKey(k), score }))
    .filter(x => x.clubType === clubType)

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const safeRatio = (x: number, denom: number) => {
  if (denom <= 0) return 0
  return clamp(x / denom, 0, 1)
}

// Get actual team size from timetables.json based on team name
const getActualTeamSize = (teamName: string): number => {
  const teamsArray = Object.values(timetablesData)
  const team = teamsArray.find(t => t.teamName === teamName)
  return team?.teamSize || 10 // fallback to 10 if not found
}

const ensureMeta = (state: State, c: Ctx): TeamMeta => {
  const k = keyOf(c)
  if (!state.meta[k]) {
    // Use actual team size from timetables.json for participation rate calculation
    const actualTeamSize = getActualTeamSize(c.team)
    state.meta[k] = {
      members: actualTeamSize,
      activityCount: 0,
      totalMinutes: 0,
      partSum: 0,
      partSamples: 0
    }
  }
  return state.meta[k]
}

export const useTeamStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      scores: {},
      meta: {},
      getScore: (c) => get().scores[keyOf(c)] ?? 0,
      addScore: (c, delta) => {
        const k = keyOf(c)
        const s = get().scores[k] ?? 0
        set({ scores: { ...get().scores, [k]: Math.max(0, s + delta) } })
      },
      setScore: (c, score) => {
        const k = keyOf(c)
        set({ scores: { ...get().scores, [k]: Math.max(0, score) } })
      },
      getMeta: (c) => {
        const state = get()
        const meta = ensureMeta(state, c)
        const avgParticipation = meta.partSamples > 0 ? meta.partSum / meta.partSamples : 0
        return { ...meta, avgParticipation }
      },
      setMembers: (c, n) => {
        // Use actual team size from timetables.json, but allow manual override
        const actualTeamSize = getActualTeamSize(c.team)
        const clampedN = n !== undefined ? clamp(n, 4, 20) : actualTeamSize
        set((state) => {
          const meta = ensureMeta(state, c)
          meta.members = clampedN
          return { ...state, meta: { ...state.meta } }
        })
      },
      addActivitySample: (c, duration, participants) => {
        set((state) => {
          const meta = ensureMeta(state, c)
          meta.activityCount += 1
          meta.totalMinutes += duration
          const ratio = safeRatio(participants, meta.members)
          meta.partSum += ratio
          meta.partSamples += 1
          return { ...state, meta: { ...state.meta } }
        })
      },
      updateActivitySample: (c, oldDuration, oldParticipants, newDuration, newParticipants) => {
        set((state) => {
          const meta = ensureMeta(state, c)
          // 횟수는 변동 없음
          meta.totalMinutes += (newDuration - oldDuration)
          meta.partSum += (safeRatio(newParticipants, meta.members) - safeRatio(oldParticipants, meta.members))
          return { ...state, meta: { ...state.meta } }
        })
      },
      removeActivitySample: (c, duration, participants) => {
        set((state) => {
          const meta = ensureMeta(state, c)
          meta.activityCount -= 1
          meta.totalMinutes -= duration
          meta.partSum -= safeRatio(participants, meta.members)
          meta.partSamples -= 1
          // 음수 방지
          meta.activityCount = Math.max(0, meta.activityCount)
          meta.totalMinutes = Math.max(0, meta.totalMinutes)
          meta.partSum = Math.max(0, meta.partSum)
          meta.partSamples = Math.max(0, meta.partSamples)
          return { ...state, meta: { ...state.meta } }
        })
      },
      resetTeam: (c) => {
        const k = keyOf(c)
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [k]: _, ...restScores } = state.scores
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [k]: __, ...restMeta } = state.meta
          return { scores: restScores, meta: restMeta }
        })
      },
      resetAll: () => set({ scores: {}, meta: {} })
    }),
    { name: 'chinba.teams.v2' }
  )
)