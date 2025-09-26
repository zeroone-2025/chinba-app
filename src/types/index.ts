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
};