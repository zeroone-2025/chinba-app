export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimePref = { startHour: number; endHour: number; weight: number };

export type Activity = {
  id: string;
  name: string;
  category: string;
  duration: number;
  minParticipants: number;
  maxParticipants?: number;
  location?: string;
  description?: string;
  timePreferences?: TimePref[];
  score?: number;
  difficulty?: Difficulty;
  emoji?: string;
};

export type PersonalSchedule = {
  id: string;           // uuid
  memberId: string;     // 참가자 ID
  title: string;        // 일정 이름
  date: string;         // YYYY-MM-DD
  startHour: number;    // 9, 10 처럼 정수(24h)
  endHour: number;      // 시작<끝
  note?: string;
};