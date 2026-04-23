ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS money_spent numeric(18,8) DEFAULT 1;
