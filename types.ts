
export interface DailyTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  impactScore: number; // 1-10, how much it moves the needle
}

export interface JournalEntry {
  id: string;
  date: number;
  content: string;
}

export interface Goal {
  id: string;
  title: string;
  routine: string;
  futureSelfImageBase64: string | null;
  currentRoutineImageBase64: string | null;
  tasks: DailyTask[];
  journal: JournalEntry[];
  motivationalQuote: string;
  progress: number; // 0 to 100 (Daily Progress)
  streak: number; // Number of days completed
  drift: number; // 0-100, deviation from the path
  targetDate: number; // Timestamp of deadline
  lastGeneratedAt: number; // Timestamp of last task generation
  createdAt: number;
}

export interface UserState {
  userImageBase64: string | null;
  goals: Goal[];
}

export enum AppStep {
  AUTH = 'AUTH',
  GOALS_LIST = 'GOALS_LIST',
  ONBOARDING_DETAILS = 'ONBOARDING_DETAILS',
  ONBOARDING_IMAGE = 'ONBOARDING_IMAGE',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD',
}

export interface PlanResponse {
  tasks: {
    title: string;
    description: string;
    impactScore: number;
  }[];
  quote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
