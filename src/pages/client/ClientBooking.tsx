import { useSearchParams } from "react-router-dom";
import { BookingCalendar } from "@/components/client/BookingCalendar";

export default function ClientBooking() {
  const [searchParams] = useSearchParams();
  const psychologistId = searchParams.get("psychologist");

  if (!psychologistId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Agendar Sesión
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecciona un psicólogo para agendar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Agendar Sesión
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecciona fecha y hora disponibles
        </p>
      </div>

      <BookingCalendar psychologistId={psychologistId} />
    </div>
  );
}
