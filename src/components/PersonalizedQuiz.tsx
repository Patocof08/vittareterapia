import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { PatientPreferences } from "@/types/preferences";

interface PersonalizedQuizProps {
  onComplete: (preferences: Omit<PatientPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const PersonalizedQuiz = ({ onComplete, onCancel }: PersonalizedQuizProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 10;

  // Form state
  const [mainConcern, setMainConcern] = useState("");
  const [mainConcernOther, setMainConcernOther] = useState("");
  const [accompanimentStyle, setAccompanimentStyle] = useState("");
  const [sessionExpectations, setSessionExpectations] = useState("");
  const [workComfort, setWorkComfort] = useState("");
  const [acceptsHomework, setAcceptsHomework] = useState("");
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(1500);
  const [genderPreference, setGenderPreference] = useState("any");
  const [wantsInclusive, setWantsInclusive] = useState(false);
  const [contextPreference, setContextPreference] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("normal");
  const [preferredLanguage, setPreferredLanguage] = useState("Español");

  const canProceed = () => {
    switch (step) {
      case 1: return mainConcern !== "";
      case 2: return accompanimentStyle !== "";
      case 3: return sessionExpectations !== "";
      case 4: return workComfort !== "";
      case 5: return acceptsHomework !== "";
      case 6: return preferredTimeSlots.length > 0;
      case 7: return true; // Budget is optional
      case 8: return true; // Personal preferences are optional
      case 9: return urgency !== "";
      case 10: return preferredLanguage !== "";
      default: return false;
    }
  };

  const handleComplete = () => {
    const preferences: Omit<PatientPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      main_concern: mainConcern,
      main_concern_other: mainConcern === "other" ? mainConcernOther : undefined,
      accompaniment_style: accompanimentStyle as any,
      session_expectations: sessionExpectations as any,
      work_comfort: workComfort as any,
      accepts_homework: acceptsHomework as any,
      preferred_time_slots: preferredTimeSlots,
      budget_min: budgetMin,
      budget_max: budgetMax,
      gender_preference: genderPreference === "any" ? undefined : genderPreference as any,
      wants_inclusive: wantsInclusive,
      context_preference: contextPreference.length > 0 ? contextPreference : undefined,
      urgency: urgency as any,
      preferred_language: preferredLanguage,
      modality: "video" as any, // Always video
      is_active: true,
    };
    onComplete(preferences);
  };

  const toggleTimeSlot = (slot: string) => {
    setPreferredTimeSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const toggleContext = (context: string) => {
    setContextPreference(prev => 
      prev.includes(context) ? prev.filter(c => c !== context) : [...prev, context]
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Atención Personalizada</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Paso {step} de {totalSteps} • Aprox. {Math.ceil((totalSteps - step + 1) * 12)} segundos
          </p>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Main concern */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">¿Qué te gustaría trabajar primero?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona lo que es más importante para ti en este momento
              </p>
            </div>
            <RadioGroup value={mainConcern} onValueChange={setMainConcern}>
              {['Ansiedad/estrés', 'Estado de ánimo', 'Pareja/familia', 'Trabajo/estudios', 'Duelo/pérdida', 'Hábitos/sueño', 'other'].map((concern) => (
                <div key={concern} className="flex items-center space-x-2">
                  <RadioGroupItem value={concern} id={concern} />
                  <Label htmlFor={concern} className="font-normal cursor-pointer">
                    {concern === 'other' ? 'Otro' : concern}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {mainConcern === "other" && (
              <Input
                placeholder="Describe brevemente..."
                value={mainConcernOther}
                onChange={(e) => setMainConcernOther(e.target.value)}
                maxLength={100}
              />
            )}
          </div>
        )}

        {/* Step 2: Accompaniment style */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">¿Qué tipo de acompañamiento prefieres?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Piensa en cómo te gustaría que fuera el estilo del profesional
              </p>
            </div>
            <RadioGroup value={accompanimentStyle} onValueChange={setAccompanimentStyle}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="practical" id="practical" />
                <div>
                  <Label htmlFor="practical" className="font-normal cursor-pointer">
                    Muy práctico y con tareas
                  </Label>
                  <p className="text-xs text-muted-foreground">Te dan ejercicios y herramientas concretas</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="conversational" id="conversational" />
                <div>
                  <Label htmlFor="conversational" className="font-normal cursor-pointer">
                    Conversacional y reflexivo
                  </Label>
                  <p className="text-xs text-muted-foreground">Más enfocado en dialogar y comprender</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <div>
                  <Label htmlFor="balanced" className="font-normal cursor-pointer">
                    Balanceado (un poco de ambos)
                  </Label>
                  <p className="text-xs text-muted-foreground">Mezcla de conversación y ejercicios prácticos</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 3: Session expectations */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">¿Qué esperas de las sesiones?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                ¿Cuál sería tu objetivo principal?
              </p>
            </div>
            <RadioGroup value={sessionExpectations} onValueChange={setSessionExpectations}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tools" id="tools" />
                <Label htmlFor="tools" className="font-normal cursor-pointer">
                  Herramientas concretas para el día a día
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="understanding" id="understanding" />
                <Label htmlFor="understanding" className="font-normal cursor-pointer">
                  Entender el origen de lo que siento
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relationships" id="relationships" />
                <Label htmlFor="relationships" className="font-normal cursor-pointer">
                  Mejorar relaciones/comunicación
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_change" id="specific_change" />
                <Label htmlFor="specific_change" className="font-normal cursor-pointer">
                  Acompañamiento en un cambio puntual
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 4: Work comfort */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">¿Cómo te sientes más cómodo al trabajar?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Elige el ritmo que mejor funcione para ti
              </p>
            </div>
            <RadioGroup value={workComfort} onValueChange={setWorkComfort}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="step_by_step" id="step_by_step" />
                <Label htmlFor="step_by_step" className="font-normal cursor-pointer">
                  Ir paso a paso con metas claras
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deep" id="deep" />
                <Label htmlFor="deep" className="font-normal cursor-pointer">
                  Profundizar con calma
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="font-normal cursor-pointer">
                  Mezcla de metas y reflexión
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 5: Homework */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">¿Te gustaría que te dejen "tareas" entre sesiones?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Ejercicios o actividades para practicar fuera de las sesiones
              </p>
            </div>
            <RadioGroup value={acceptsHomework} onValueChange={setAcceptsHomework}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="font-normal cursor-pointer">
                  Sí, me ayuda
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sometimes" id="sometimes" />
                <Label htmlFor="sometimes" className="font-normal cursor-pointer">
                  A veces
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="font-normal cursor-pointer">
                  No por ahora
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 6: Availability */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Disponibilidad preferida</Label>
              <p className="text-sm text-muted-foreground mt-1">
                ¿En qué horarios te gustaría tener sesiones? (selecciona todas las que apliquen)
              </p>
            </div>
            <div className="space-y-2">
              {['morning', 'afternoon', 'evening', 'weekend'].map((slot) => (
                <div key={slot} className="flex items-center space-x-2">
                  <Checkbox
                    id={slot}
                    checked={preferredTimeSlots.includes(slot)}
                    onCheckedChange={() => toggleTimeSlot(slot)}
                  />
                  <Label htmlFor={slot} className="font-normal cursor-pointer">
                    {slot === 'morning' && 'Mañana (8:00 - 12:00)'}
                    {slot === 'afternoon' && 'Tarde (12:00 - 18:00)'}
                    {slot === 'evening' && 'Noche (18:00 - 22:00)'}
                    {slot === 'weekend' && 'Fines de semana'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Budget */}
        {step === 7 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Presupuesto por sesión</Label>
              <p className="text-sm text-muted-foreground mt-1">
                ¿Cuánto estás dispuesto a invertir en cada sesión?
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Presupuesto mínimo</Label>
                <Select value={budgetMin.toString()} onValueChange={(val) => setBudgetMin(Number(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">$300</SelectItem>
                    <SelectItem value="400">$400</SelectItem>
                    <SelectItem value="500">$500</SelectItem>
                    <SelectItem value="600">$600</SelectItem>
                    <SelectItem value="700">$700</SelectItem>
                    <SelectItem value="800">$800</SelectItem>
                    <SelectItem value="900">$900</SelectItem>
                    <SelectItem value="1000">$1,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Presupuesto máximo</Label>
                <Select value={budgetMax.toString()} onValueChange={(val) => setBudgetMax(Number(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="800">$800</SelectItem>
                    <SelectItem value="900">$900</SelectItem>
                    <SelectItem value="1000">$1,000</SelectItem>
                    <SelectItem value="1200">$1,200</SelectItem>
                    <SelectItem value="1500">$1,500</SelectItem>
                    <SelectItem value="2000">$2,000</SelectItem>
                    <SelectItem value="2500">$2,500</SelectItem>
                    <SelectItem value="3000">$3,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Personal preferences */}
        {step === 8 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">Preferencias personales (opcional)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Estas preferencias nos ayudan a encontrar un mejor match para ti
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Género del profesional</Label>
                <RadioGroup value={genderPreference} onValueChange={setGenderPreference}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">Mujer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">Hombre</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="any" />
                    <Label htmlFor="any" className="font-normal cursor-pointer">Indistinto</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inclusive"
                  checked={wantsInclusive}
                  onCheckedChange={(checked) => setWantsInclusive(checked as boolean)}
                />
                <Label htmlFor="inclusive" className="font-normal cursor-pointer">
                  Que sea inclusivo y afirmativo (LGBTQ+)
                </Label>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Contexto especial</Label>
                <div className="space-y-2">
                  {['work', 'parental', 'student'].map((context) => (
                    <div key={context} className="flex items-center space-x-2">
                      <Checkbox
                        id={context}
                        checked={contextPreference.includes(context)}
                        onCheckedChange={() => toggleContext(context)}
                      />
                      <Label htmlFor={context} className="font-normal cursor-pointer">
                        {context === 'work' && 'Que entienda retos laborales'}
                        {context === 'parental' && 'Que entienda retos parentales'}
                        {context === 'student' && 'Que entienda retos estudiantiles'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Urgency */}
        {step === 9 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Urgencia</Label>
              <p className="text-sm text-muted-foreground mt-1">
                ¿Qué tan pronto necesitas comenzar?
              </p>
            </div>
            <RadioGroup value={urgency} onValueChange={setUrgency}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <div>
                  <Label htmlFor="normal" className="font-normal cursor-pointer">
                    Normal (esta semana)
                  </Label>
                  <p className="text-xs text-muted-foreground">Puedo esperar unos días</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <div>
                  <Label htmlFor="urgent" className="font-normal cursor-pointer">
                    Lo antes posible (próximos 3 días)
                  </Label>
                  <p className="text-xs text-muted-foreground">Necesito empezar pronto</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 10: Language */}
        {step === 10 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">Idioma preferido</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Últimos detalles para personalizar tu búsqueda
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Idioma principal</Label>
                <RadioGroup value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Español" id="Español" />
                    <Label htmlFor="Español" className="font-normal cursor-pointer">Español</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Inglés" id="Inglés" />
                    <Label htmlFor="Inglés" className="font-normal cursor-pointer">Inglés</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Catalán" id="Catalán" />
                    <Label htmlFor="Catalán" className="font-normal cursor-pointer">Catalán</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <Label className="text-sm font-medium mb-2 block">Modalidad</Label>
                <p className="text-sm text-muted-foreground">
                  Todas las sesiones se realizan por <strong>Videollamada</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
            >
              Ver recomendaciones
              <Sparkles className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
