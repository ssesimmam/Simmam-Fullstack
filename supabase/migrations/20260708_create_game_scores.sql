CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  house TEXT NOT NULL,
  register_number TEXT NOT NULL UNIQUE,
  time_seconds INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_scores_time ON public.game_scores(time_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_game_scores_house ON public.game_scores(house);
CREATE INDEX IF NOT EXISTS idx_game_scores_completed_at ON public.game_scores(completed_at DESC);

-- Insert singleton row already done so that table gets created in Supabase
-- UNIQUE on register_number enforces one-play-per-person at DB level
