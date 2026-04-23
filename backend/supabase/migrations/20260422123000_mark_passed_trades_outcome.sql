UPDATE public.trades
SET outcome = 'PASSED'
WHERE lower(coalesce(outcome, '')) IN ('', 'undecided')
  AND (
    lower(coalesce(status, '')) = 'pass'
    OR lower(coalesce(trade_decision, '')) = 'pass'
    OR lower(coalesce(trade_decision, '')) = 'passed'
  );
