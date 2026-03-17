import { useReveal, useCounter } from "@/hooks/useReveal";

const logos = [
  "UNAM",
  "IMSS",
  "ISSSTE",
  "INPRFM",
  "CONACYT",
  "CDMX",
  "UNAM",
  "IMSS",
  "ISSSTE",
  "INPRFM",
  "CONACYT",
  "CDMX",
];

const TrustStat = ({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) => {
  const ref = useCounter(value);
  return (
    <div className="text-center px-6 py-4">
      <div className="font-karla font-bold text-2xl text-zinc-100 counter-value flex items-baseline gap-0.5 justify-center">
        <span ref={ref}>0</span>
        <span>{suffix}</span>
      </div>
      <div className="font-karla text-xs text-zinc-500 mt-0.5 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
};

export const TrustBarSection = () => {
  const sectionRef = useReveal();

  return (
    <section ref={sectionRef} className="bg-[#0A1A10] pb-24">
      {/* Stats row */}
      <div className="container mx-auto px-4">
        <div className="reveal flex flex-wrap justify-center gap-2 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800/50 border border-zinc-800/40 rounded-2xl overflow-hidden max-w-3xl mx-auto bg-[#0D2015]/50">
          <TrustStat value={25} suffix="+" label="Psicólogos activos" />
          <TrustStat value={500} suffix="+" label="Sesiones completadas" />
          <TrustStat value={98} suffix="%" label="Satisfacción del paciente" />
          <TrustStat value={4} suffix="+ años" label="En operación" />
        </div>
      </div>

      {/* Trust label */}
      <div className="reveal reveal-delay-2 container mx-auto px-4 mt-16 text-center">
        <p className="font-karla text-xs text-zinc-600 uppercase tracking-widest mb-8">
          Psicólogos formados en instituciones como
        </p>

        {/* Ticker */}
        <div className="relative overflow-hidden max-w-3xl mx-auto">
          <div className="flex gap-12 animate-[ticker_30s_linear_infinite]">
            {logos.map((name, i) => (
              <span
                key={i}
                className="font-karla font-bold text-zinc-700 text-sm whitespace-nowrap hover:text-zinc-400 transition-colors duration-300 cursor-default flex-shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
          {/* fade edges */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0A1A10] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0A1A10] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};
