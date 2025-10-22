import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Video, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MatchReason } from "@/types/preferences";

interface TherapistCardProps {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  rating: number;
  reviews: number;
  price: number;
  approaches: string[];
  languages: string[];
  availability: string;
  matchLevel?: 'top' | 'high' | 'compatible';
  matchReasons?: MatchReason[];
}

export const TherapistCard = ({
  id,
  name,
  specialty,
  photo,
  rating,
  reviews,
  price,
  approaches,
  languages,
  availability,
  matchLevel,
  matchReasons,
}: TherapistCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Eliminado de favoritos" : "Agregado a favoritos");
  };

  const matchLevelLabels = {
    top: { label: 'Top match', color: 'bg-primary text-primary-foreground' },
    high: { label: 'Muy compatible', color: 'bg-secondary text-secondary-foreground' },
    compatible: { label: 'Compatible', color: 'bg-muted text-muted-foreground' }
  };

  return (
    <div className="bg-card rounded-xl shadow-medium hover:shadow-large transition-all p-6 border border-border">
      {matchLevel && (
        <div className="mb-4">
          <Badge className={matchLevelLabels[matchLevel].color}>
            <Sparkles className="w-3 h-3 mr-1" />
            {matchLevelLabels[matchLevel].label}
          </Badge>
        </div>
      )}
      <div className="flex items-start space-x-4">
        {/* Photo */}
        <img
          src={photo}
          alt={name}
          className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
        />

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <Link
                to={`/therapist/${id}`}
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                {name}
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                Enfoque: {approaches[0] || 'No especificado'}
              </p>
            </div>
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {specialty.split(',').map((spec, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0.5">
                {spec.trim()}
              </Badge>
            ))}
          </div>

          {/* Languages & Availability */}
          <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Video className="w-4 h-4" />
              <span>Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{languages.join(", ")}</span>
            </div>
          </div>

          {/* Match reasons */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-2">Por qué es buen match:</p>
              <div className="flex flex-wrap gap-1">
                {matchReasons.map((reason, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {reason.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            {price > 0 ? (
              <div>
                <span className="text-2xl font-bold text-foreground">${price}</span>
                <span className="text-sm text-muted-foreground ml-1">/ sesión</span>
              </div>
            ) : (
              <div>
                <span className="text-sm text-muted-foreground">Consultar precio</span>
              </div>
            )}
            <div className="flex gap-2">
              <Link to={`/client/booking?psychologist=${id}`}>
                <Button variant="default" size="sm">Agendar cita</Button>
              </Link>
              <Link to={`/therapist/${id}`}>
                <Button variant="outline" size="sm">Ver perfil</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
