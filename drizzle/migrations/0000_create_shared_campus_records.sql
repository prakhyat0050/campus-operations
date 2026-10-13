-- Shared campus records: maintenance requests, community reports and security events,
-- visible to everyone using the app (no sign-in yet, so the demo table is public).
CREATE TABLE public.campus_records (
  ref_code text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('maintenance','community','security')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  building text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Critical','High','Medium','Low')),
  status text NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported','Under Review','Assigned','In Progress','Resolved')),
  team text NOT NULL DEFAULT '',
  photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity timeline entries for each record.
CREATE TABLE public.campus_record_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_ref text NOT NULL REFERENCES public.campus_records(ref_code) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX campus_record_events_record_idx ON public.campus_record_events (record_ref, created_at);

CREATE OR REPLACE FUNCTION public.touch_campus_records_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campus_records_updated
  BEFORE UPDATE ON public.campus_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_campus_records_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_record_events TO authenticated;
GRANT ALL ON public.campus_records TO service_role;
GRANT ALL ON public.campus_record_events TO service_role;

ALTER TABLE public.campus_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_record_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read campus records"
  ON public.campus_records FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can submit campus records"
  ON public.campus_records FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update campus records"
  ON public.campus_records FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete campus records"
  ON public.campus_records FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read timelines"
  ON public.campus_record_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can add timeline notes"
  ON public.campus_record_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete timeline notes"
  ON public.campus_record_events FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);