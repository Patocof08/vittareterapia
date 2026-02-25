import { useState } from 'react';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { stripePromise } from '@/lib/stripe';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ─── Inline SVG icons ──────────────────────────────────────────────────── */

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface SessionInfo {
  therapistName: string;
  therapistSpecialty?: string;
  startTime: Date;
  durationMinutes: number;
  sessionType: 'single_session' | 'package_4' | 'package_8';
  baseAmount: number;
  feeRate: number;
  // Subscription-specific fields
  isSubscription?: boolean;
  sessionsTotal?: number;
  discountPercentage?: number;
  monthlyAmount?: number; // total with fee, used for renewal notice
}

const SESSION_LABELS: Record<string, string> = {
  single_session: 'Sesión individual',
  package_4: 'Paquete de 4 sesiones',
  package_8: 'Paquete de 8 sesiones',
};

/* ─── Inner form ─────────────────────────────────────────────────────────── */

interface CheckoutFormProps {
  sessionInfo?: SessionInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ sessionInfo, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const fee    = sessionInfo ? Math.round(sessionInfo.baseAmount * sessionInfo.feeRate * 100) / 100 : 0;
  const total  = sessionInfo ? sessionInfo.baseAmount + fee : 0;
  const initial = sessionInfo?.therapistName.trim().split(' ').pop()?.[0]?.toUpperCase() ?? 'T';

  // Subscription discount display
  const originalTotal = sessionInfo?.isSubscription && sessionInfo.discountPercentage
    ? Math.round(sessionInfo.baseAmount / (1 - sessionInfo.discountPercentage / 100) * 100) / 100
    : null;
  const discountAmount = originalTotal ? Math.round((originalTotal - sessionInfo!.baseAmount) * 100) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/portal/payment-success` },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Error al procesar el pago');
      } else {
        toast.success('¡Pago procesado con éxito!');
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Green gradient header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
        padding: '28px 28px 24px',
        color: 'white',
      }}>
        <p style={{ fontSize: '13px', opacity: 0.8, margin: '0 0 4px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>
          Confirmar pago
        </p>
        <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
          <span style={{ fontSize: '16px', fontWeight: 400, opacity: 0.7 }}>MXN</span>
        </p>
      </div>

      <div style={{ padding: '24px 28px 28px' }}>

        {/* ── Session info card ── */}
        {sessionInfo && (
          <div style={{ background: '#f8faf9', border: '1px solid #e8eeeb', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '18px', fontWeight: 600, color: '#065f46',
              }}>
                {initial}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#1a1a1a' }}>
                  {sessionInfo.therapistName}
                </p>
                {sessionInfo.therapistSpecialty && (
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    {sessionInfo.therapistSpecialty}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}><CalendarIcon /></span>
                {format(sessionInfo.startTime, "EEEE, d MMM", { locale: es })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}><ClockIcon /></span>
                {format(sessionInfo.startTime, 'HH:mm')} · {sessionInfo.durationMinutes} min
              </div>
            </div>

            <div style={{
              marginTop: '12px', padding: '6px 12px', background: '#ecfdf5', borderRadius: '8px',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 500, color: '#065f46',
            }}>
              <CheckIcon />
              {SESSION_LABELS[sessionInfo.sessionType] ?? sessionInfo.sessionType}
            </div>
          </div>
        )}

        {/* ── Price breakdown ── */}
        {sessionInfo && (
          <div style={{ marginBottom: '20px' }}>
            {/* Subscription: show original price with strikethrough */}
            {sessionInfo.isSubscription && originalTotal ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  Paquete {sessionInfo.sessionsTotal} sesiones
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#9ca3af', textDecoration: 'line-through' }}>
                  ${originalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Sesión de psicología</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                  ${sessionInfo.baseAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Subscription: discount line */}
            {sessionInfo.isSubscription && sessionInfo.discountPercentage && discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Descuento paquete</span>
                  <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    -{sessionInfo.discountPercentage}%
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#059669' }}>
                  -${discountAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Subscription: discounted base */}
            {sessionInfo.isSubscription && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Subtotal</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                  ${sessionInfo.baseAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Fee line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Cargo por servicio</span>
                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                  {(sessionInfo.feeRate * 100).toFixed(0)}%
                </span>
              </div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                ${fee.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>Total a pagar</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#065f46' }}>
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Auto-renewal notice for subscriptions */}
            {sessionInfo.isSubscription && (
              <div style={{
                marginTop: '14px', padding: '10px 14px',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⟳</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#065f46', lineHeight: 1.5 }}>
                  <strong>Renovación automática mensual</strong> — Se cobrará $
                  {(sessionInfo.monthlyAmount ?? total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN/mes.
                  Cancela cuando quieras.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Payment method selector (visual) ── */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Método de pago
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Tarjeta – active */}
            <div style={{
              flex: 1, padding: '14px',
              border: '2px solid #059669', borderRadius: '12px', background: '#f0fdf4',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            }}>
              <CreditCardIcon />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Tarjeta</span>
            </div>
            {/* SPEI – coming soon */}
            <div style={{
              flex: 1, padding: '14px',
              border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fafafa',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              opacity: 0.45,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', textAlign: 'center', lineHeight: 1.3 }}>
                SPEI<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Próximamente</span>
              </span>
            </div>
            {/* Apple/Google Pay – handled by Stripe automatically */}
            <div style={{
              flex: 1, padding: '14px',
              border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fafafa',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              opacity: 0.45,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="15" r="1.5" fill="currentColor" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Apple Pay</span>
            </div>
          </div>
        </div>

        {/* ── Stripe PaymentElement ── */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <PaymentElement />
          </div>

          {/* Pay button */}
          <button
            type="submit"
            disabled={!stripe || !elements || loading}
            style={{
              width: '100%', padding: '16px',
              background: loading || !stripe ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '16px', fontWeight: 600,
              cursor: loading || !stripe ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)',
              fontFamily: 'inherit', letterSpacing: '0.2px', transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="60" strokeLinecap="round" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <LockIcon />
                Pagar ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </>
            )}
          </button>
        </form>

        {/* ── Trust badges ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '18px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9ca3af', fontSize: '12px' }}>
            <ShieldIcon /><span>Pago seguro</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9ca3af', fontSize: '12px' }}>
            <LockIcon /><span>Cifrado SSL</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            Powered by <span style={{ fontWeight: 600 }}>Stripe</span>
          </div>
        </div>

        {/* Cancel link */}
        <button
          type="button"
          onClick={onCancel}
          style={{ display: 'block', width: '100%', marginTop: '14px', padding: '8px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancelar
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Public wrapper ─────────────────────────────────────────────────────── */

export interface StripePaymentFormProps {
  clientSecret: string;
  sessionInfo?: SessionInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripePaymentForm({ clientSecret, sessionInfo, onSuccess, onCancel }: StripePaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#059669',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#ef4444',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm sessionInfo={sessionInfo} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
