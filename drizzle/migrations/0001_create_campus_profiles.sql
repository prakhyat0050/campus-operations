-- Campus user profiles: store authenticated user identity and platform role.
CREATE TABLE public.campus_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  role text NOT NULL DEFAULT 'Super Admin' CHECK (role IN ('Super Admin','Facilities Manager','Security Manager','Sustainability Officer','Student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_campus_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campus_profiles_updated
  BEFORE UPDATE ON public.campus_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_campus_profiles_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_profiles TO authenticated;
GRANT ALL ON public.campus_profiles TO service_role;

ALTER TABLE public.campus_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.campus_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.campus_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.campus_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON public.campus_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
