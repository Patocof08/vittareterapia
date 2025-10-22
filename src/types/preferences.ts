export interface PatientPreferences {
  id?: string;
  user_id?: string;
  main_concern: string;
  main_concern_other?: string;
  accompaniment_style: 'practical' | 'conversational' | 'balanced';
  session_expectations: 'tools' | 'understanding' | 'relationships' | 'specific_change';
  work_comfort: 'step_by_step' | 'deep' | 'mixed';
  accepts_homework: 'yes' | 'sometimes' | 'no';
  preferred_time_slots: string[];
  budget_min?: number;
  budget_max?: number;
  gender_preference?: 'female' | 'male' | 'any';
  wants_inclusive?: boolean;
  context_preference?: string[];
  urgency: 'normal' | 'urgent';
  preferred_language: string;
  modality: 'video' | 'mixed';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MatchReason {
  key: string;
  label: string;
}

export interface TherapistMatch {
  therapist: any;
  score: number;
  reasons: MatchReason[];
  matchLevel: 'top' | 'high' | 'compatible';
}
