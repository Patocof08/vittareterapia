import { PatientPreferences, TherapistMatch, MatchReason } from "@/types/preferences";

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  approaches: string[];
  languages: string[];
  price: number;
  availability: string;
  [key: string]: any;
}

// Map concerns to specialties
const concernToSpecialty: Record<string, string[]> = {
  "Ansiedad/estrés": ["Psicología Clínica", "Terapia Cognitivo-Conductual"],
  "Estado de ánimo": ["Psicología Clínica"],
  "Pareja/familia": ["Terapia de Pareja", "Terapia Familiar"],
  "Trabajo/estudios": ["Psicología Clínica"],
  "Duelo/pérdida": ["Psicología Clínica"],
  "Hábitos/sueño": ["Psicología Clínica"],
};

// Map style preferences to approaches
const styleToApproaches: Record<string, string[]> = {
  practical: ["TCC", "Terapia Cognitivo-Conductual", "Terapia Breve"],
  conversational: ["Terapia Humanista", "Psicoanálisis", "Terapia Sistémica"],
  balanced: ["Terapia Integrativa", "Psicología Clínica"],
};

export const calculateTherapistMatch = (
  therapist: Therapist,
  preferences: PatientPreferences
): TherapistMatch => {
  let score = 0;
  const reasons: MatchReason[] = [];

  // 1. Main concern match (highest priority) - 30 points
  const concernSpecialties = concernToSpecialty[preferences.main_concern] || [];
  if (concernSpecialties.some(spec => therapist.specialty.includes(spec))) {
    score += 30;
    reasons.push({
      key: 'specialty',
      label: `Trabaja ${preferences.main_concern.toLowerCase()}`
    });
  }

  // 2. Style match - 25 points
  const preferredApproaches = styleToApproaches[preferences.accompaniment_style] || [];
  const hasApproachMatch = therapist.approaches.some(approach => 
    preferredApproaches.some(pref => approach.includes(pref))
  );
  if (hasApproachMatch) {
    score += 25;
    const styleLabels = {
      practical: 'estilo práctico',
      conversational: 'estilo conversacional',
      balanced: 'estilo balanceado'
    };
    reasons.push({
      key: 'style',
      label: styleLabels[preferences.accompaniment_style]
    });
  }

  // 3. Budget match - 20 points
  const withinBudget = (!preferences.budget_min || therapist.price >= preferences.budget_min) &&
                       (!preferences.budget_max || therapist.price <= preferences.budget_max);
  if (withinBudget) {
    score += 20;
    reasons.push({
      key: 'budget',
      label: 'dentro de tu presupuesto'
    });
  } else if (preferences.budget_max && therapist.price <= preferences.budget_max * 1.15) {
    // Close to budget
    score += 10;
  }

  // 4. Language match - 15 points
  if (therapist.languages.includes(preferences.preferred_language)) {
    score += 15;
    reasons.push({
      key: 'language',
      label: `habla ${preferences.preferred_language}`
    });
  }

  // 5. Time slots (if we had availability data) - 10 points
  // For now, we'll give partial credit based on general availability
  if (preferences.preferred_time_slots.length > 0) {
    score += 5;
    const timeLabels = {
      morning: 'mañana',
      afternoon: 'tarde',
      evening: 'noche',
      weekend: 'fin de semana'
    };
    const timeLabel = preferences.preferred_time_slots
      .map(slot => timeLabels[slot as keyof typeof timeLabels])
      .filter(Boolean)
      .join('/');
    if (timeLabel) {
      reasons.push({
        key: 'availability',
        label: `horario ${timeLabel}`
      });
    }
  }

  // Determine match level
  let matchLevel: 'top' | 'high' | 'compatible';
  if (score >= 70) {
    matchLevel = 'top';
  } else if (score >= 50) {
    matchLevel = 'high';
  } else {
    matchLevel = 'compatible';
  }

  return {
    therapist,
    score,
    reasons,
    matchLevel
  };
};

export const rankTherapists = (
  therapists: Therapist[],
  preferences: PatientPreferences
): TherapistMatch[] => {
  const matches = therapists.map(therapist => 
    calculateTherapistMatch(therapist, preferences)
  );

  // Sort by score (descending)
  return matches.sort((a, b) => b.score - a.score);
};
