import { useEffect, useState } from "react";
import { fetchPublicProfiles } from "@/lib/psychologistQueries";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustPillarsSection } from "@/components/landing/TrustPillarsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturedTherapistsSection } from "@/components/landing/FeaturedTherapistsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

type Therapist = {
  id: string;
  first_name: string;
  last_name: string;
  specialties?: string[];
  profile_photo_url?: string;
  therapeutic_approaches?: string[];
  languages?: string[];
};

type RatingsMap = Record<string, { avg_rating: number; review_count: number }>;

const Index = () => {
  const [featuredTherapists, setFeaturedTherapists] = useState<Therapist[]>([]);
  const [ratingsMap, setRatingsMap] = useState<RatingsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicProfiles();
        if (data) {
          setFeaturedTherapists(data.slice(0, 3));
          // @ts-ignore - Types will regenerate automatically
          const { data: ratingsData } = await supabase
            .from("psychologist_ratings")
            .select("psychologist_id, avg_rating, review_count");
          if (ratingsData) {
            const map: RatingsMap = {};
            ratingsData.forEach((r: any) => {
              map[r.psychologist_id] = {
                avg_rating: Number(r.avg_rating),
                review_count: r.review_count,
              };
            });
            setRatingsMap(map);
          }
        }
      } catch (err) {
        console.error("Error loading therapists:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <TrustPillarsSection />
          <HowItWorksSection />
          <FeaturedTherapistsSection
            therapists={featuredTherapists}
            ratingsMap={ratingsMap}
            loading={loading}
          />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

export default Index;
