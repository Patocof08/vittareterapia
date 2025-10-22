import { supabase } from "@/integrations/supabase/client";

/**
 * Query public psychologist profiles WITHOUT exposing sensitive contact information
 * 
 * SECURITY: Never include 'email' or 'phone' in public profile queries
 * These fields should only be visible to:
 * - The psychologist themselves (viewing their own profile)
 * - Platform administrators
 * - Clients with confirmed bookings (through a secure messaging system)
 */

// Fields safe for public display
const PUBLIC_PROFILE_FIELDS = `
  id,
  user_id,
  first_name,
  last_name,
  city,
  country,
  languages,
  modalities,
  profile_photo_url,
  years_experience,
  therapeutic_approaches,
  specialties,
  populations,
  bio_short,
  bio_extended,
  is_published,
  created_at
`;

/**
 * Fetch all published psychologist profiles for public directory
 * Excludes: email, phone, verification_status, verification_notes, emergency_disclaimer_accepted, terms_accepted
 */
export const fetchPublicProfiles = async () => {
  const { data, error } = await supabase
    .from("psychologist_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("is_published", true)
    .eq("verification_status", "approved") // Only show verified profiles
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Fetch a single public profile by ID
 */
export const fetchPublicProfileById = async (profileId: string) => {
  const { data, error } = await supabase
    .from("psychologist_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("id", profileId)
    .eq("is_published", true)
    .eq("verification_status", "approved")
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch psychologist's own profile (includes all fields for self-view)
 * Only callable when authenticated as that psychologist
 */
export const fetchOwnProfile = async () => {
  const { data, error } = await supabase
    .from("psychologist_profiles")
    .select("*") // All fields available to self
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch pricing for a published profile
 * Pricing is public information for booking purposes
 */
export const fetchPublicPricing = async (psychologistId: string) => {
  const { data, error } = await supabase
    .from("psychologist_pricing")
    .select(`
      session_price,
      currency,
      package_4_price,
      package_8_price,
      first_session_price,
      session_duration_minutes,
      cancellation_policy
    `)
    .eq("psychologist_id", psychologistId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch availability for a published profile
 * Availability is public information for booking purposes
 */
export const fetchPublicAvailability = async (psychologistId: string) => {
  const { data, error } = await supabase
    .from("psychologist_availability")
    .select("*")
    .eq("psychologist_id", psychologistId)
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Search public profiles with filters
 */
export const searchPublicProfiles = async (filters: {
  searchTerm?: string;
  specialties?: string[];
  languages?: string[];
  minPrice?: number;
  maxPrice?: number;
}) => {
  let query = supabase
    .from("psychologist_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("is_published", true)
    .eq("verification_status", "approved");

  // Apply filters
  if (filters.specialties && filters.specialties.length > 0) {
    query = query.overlaps("specialties", filters.specialties);
  }

  if (filters.languages && filters.languages.length > 0) {
    query = query.overlaps("languages", filters.languages);
  }

  // Note: Price filtering requires joining with psychologist_pricing table
  // or fetching prices separately

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  // Client-side filtering for search term (full-text search would be better for production)
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    return data.filter((profile) => {
      return (
        profile.first_name?.toLowerCase().includes(term) ||
        profile.last_name?.toLowerCase().includes(term) ||
        profile.bio_short?.toLowerCase().includes(term) ||
        profile.specialties?.some((s: string) => s.toLowerCase().includes(term)) ||
        profile.therapeutic_approaches?.some((a: string) => a.toLowerCase().includes(term))
      );
    });
  }

  return data;
};
