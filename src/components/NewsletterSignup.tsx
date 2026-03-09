import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

interface NewsletterSignupProps {
  source?: string;
  variant?: "inline" | "card";
}

export const NewsletterSignup = ({ source = "blog", variant = "card" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase(), source });

      if (error) {
        if (error.message?.includes("duplicate")) {
          toast.info("Ya estás suscrito. ¡Gracias!");
          setSuccess(true);
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast.success("¡Te has suscrito exitosamente!");
      }
    } catch (error) {
      console.error("Newsletter error:", error);
      toast.error("Error al suscribirte. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={variant === "card" ? "bg-primary/5 border border-primary/20 rounded-xl p-6 text-center" : "flex items-center gap-2"}>
        <Check className="w-5 h-5 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-foreground font-medium">¡Gracias por suscribirte!</p>
        <p className="text-xs text-muted-foreground mt-1">Te enviaremos contenido sobre bienestar mental.</p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Suscribirme"}
        </Button>
      </form>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">¿Te gustó este contenido?</h3>
          <p className="text-sm text-muted-foreground">Recibe artículos como este directo en tu correo.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Suscribirme"}
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground mt-2">Sin spam. Puedes darte de baja en cualquier momento.</p>
    </div>
  );
};
