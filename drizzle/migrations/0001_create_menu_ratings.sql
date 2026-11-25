CREATE TABLE public.menu_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_day SMALLINT NOT NULL REFERENCES public.weekly_menus(day) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, menu_day)
);

GRANT SELECT ON public.menu_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_ratings TO authenticated;
GRANT ALL ON public.menu_ratings TO service_role;

ALTER TABLE public.menu_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads menu ratings"
  ON public.menu_ratings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users insert own menu ratings"
  ON public.menu_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own menu ratings"
  ON public.menu_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own menu ratings"
  ON public.menu_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_menu_ratings_day ON public.menu_ratings (menu_day);