import { Star } from "lucide-react";

interface ReviewCardProps {
  name: string;
  photo: string;
  rating: number;
  text: string;
  date: string;
}

export const ReviewCard = ({ name, photo, rating, text, date }: ReviewCardProps) => {
  return (
    <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={photo}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{name}</h4>
          <div className="flex items-center space-x-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? "fill-secondary text-secondary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
};
