
-- Add foreign key relationship for psychologist_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_psychologist_id_fkey'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_psychologist_id_fkey 
      FOREIGN KEY (psychologist_id) 
      REFERENCES psychologist_profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;
