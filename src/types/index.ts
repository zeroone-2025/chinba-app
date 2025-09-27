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