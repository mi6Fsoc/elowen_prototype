
export type SkinType = 'Oily' | 'Dry' | 'Combination' | 'Normal' | 'Sensitive';

export interface SkinAssessment {
  skinType: SkinType;
  concerns: string[];
  sensitivity: number; // 1-5
  lifestyle: string[];
  currentRoutine: string;
}

export interface Recommendation {
  productName: string;
  description: string;
  learnMoreUrl: string;
  hydrationImpact: string;
}

export interface RoutineStep {
  id: string;
  name: string;
  type: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'spf' | 'treatment';
  description: string;
  whyNeeded: string;
  whatToLookFor: string;
  isCompleted: boolean;
  recommendations: Recommendation[];
}

export interface DailyRoutine {
  am: RoutineStep[];
  pm: RoutineStep[];
}

export interface SkinAnalysis {
  id: string;
  date: string;
  photoUrl: string;
  metrics: {
    hydration: number;
    clarity: number;
    texture: number;
    redness: number;
  };
  summary: string;
  coachNote: string;
}

export interface UserProfile {
  name: string;
  assessment?: SkinAssessment;
  routine?: DailyRoutine;
  analyses: SkinAnalysis[];
  isSubscribed: boolean;
}

export type AppView = 
  | 'onboarding' 
  | 'home' 
  | 'routine' 
  | 'progress' 
  | 'chat' 
  | 'library' 
  | 'profile' 
  | 'capture';
