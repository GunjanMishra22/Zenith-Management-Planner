
export interface Habit {
  id: string;
  name: string;
  completedDays: string[];
  category: string;
}

export interface HealthMetric {
  date: string;
  weight?: number;
  sleepHours?: number;
  waterIntake?: number;
  steps?: number;
  notes?: string;
}

export interface WealthEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
}

export interface PlannerState {
  habits: Habit[];
  health: HealthMetric[];
  wealth: WealthEntry[];
  lastSaved: string;
}

export type ViewType = 'dashboard' | 'habits' | 'health' | 'wealth' | 'calendar';
