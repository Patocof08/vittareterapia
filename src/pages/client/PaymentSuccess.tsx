import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectStatus = searchParams.get('redirect_status');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6">
      {redirectStatus === 'succeeded' ? (
        <>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">¡Pago exitoso!</h1>
          <p className="text-muted-foreground text-center">
            Tu pago fue procesado correctamente. Tu cita ha sido confirmada.
          </p>
        </>
      ) : redirectStatus === 'processing' ? (
        <>
          <Clock className="h-16 w-16 text-yellow-500" />
          <h1 className="text-2xl font-bold">Procesando pago...</h1>
          <p className="text-muted-foreground text-center">
            Tu pago está siendo procesado. Te notificaremos cuando se confirme.
          </p>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold">Error en el pago</h1>
          <p className="text-muted-foreground text-center">
            Hubo un problema con tu pago. Por favor intenta de nuevo.
          </p>
        </>
      )}
      <Button onClick={() => navigate('/portal/sesiones')}>
        Ir a Mis Sesiones
      </Button>
    </div>
  );
}
