import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  sessionCount: number;
  lastSession: string | null;
}

export default function TherapistPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return;

      try {
        console.log("Calling get_therapist_patients RPC...");
        
        // Call the secure RPC function to get therapist's patients
        const { data, error } = await supabase
          .rpc("get_therapist_patients");

        if (error) {
          console.error("Error fetching patients:", error);
          return;
        }

        console.log("RPC returned:", data);

        if (!data) {
          setLoading(false);
          return;
        }

        // Map RPC results to Patient interface
        const mappedPatients: Patient[] = data.map((row: any) => ({
          id: row.patient_id,
          full_name: row.full_name || "Sin nombre",
          avatar_url: row.avatar_url,
          email: row.email || "",
          sessionCount: row.session_count,
          lastSession: row.last_session,
        }));

        // Fetch transcript counts per patient
        const patientIds = mappedPatients.map(p => p.id);
        if (patientIds.length > 0) {
          const { data: transcriptCounts } = await (supabase as any)
            .from("session_transcripts")
            .select("patient_id, id")
            .in("patient_id", patientIds)
            .eq("status", "completed");

          if (transcriptCounts) {
            const countByPatient: Record<string, number> = {};
            transcriptCounts.forEach((t: any) => {
              countByPatient[t.patient_id] = (countByPatient[t.patient_id] || 0) + 1;
            });
            mappedPatients.forEach(p => {
              (p as any).transcriptCount = countByPatient[p.id] || 0;
            });
          }
        }

        console.log("Mapped patients:", mappedPatients);
        setPatients(mappedPatients);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis Pacientes</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la información de tus pacientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Pacientes
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar paciente por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron pacientes" : "No tienes pacientes registrados todavía"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/therapist/patients/${patient.id}`)}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={patient.avatar_url || ""} />
                      <AvatarFallback>
                        {patient.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {patient.sessionCount} sesión{patient.sessionCount !== 1 ? "es" : ""}
                    </p>
                    {(patient as any).transcriptCount > 0 && (
                      <p className="text-xs text-emerald-600">
                        {(patient as any).transcriptCount} transcripción{(patient as any).transcriptCount !== 1 ? "es" : ""}
                      </p>
                    )}
                    {patient.lastSession && (
                      <p className="text-xs text-muted-foreground">
                        Última: {new Date(patient.lastSession).toLocaleDateString("es-MX")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
