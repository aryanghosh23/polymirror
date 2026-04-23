ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS market jsonb;
