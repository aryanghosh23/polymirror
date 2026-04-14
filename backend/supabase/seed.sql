INSERT INTO public.traders (wallet_address, trusted_score, still_monitoring, statistics)
VALUES
  ('0x64d62f624dff82248a645bb8007f2c8b012c8795', 9, true, '{"win_rate": 0.72, "money_won": 12000, "money_lost": 4000, "total_pnl": 8000}'),
  ('0x1111111111111111111111111111111111111111', 7, true, '{"win_rate": 0.65, "money_won": 9000, "money_lost": 5000, "total_pnl": 4000}'),
  ('0x2222222222222222222222222222222222222222', 6, true, '{"win_rate": 0.58, "money_won": 7000, "money_lost": 6000, "total_pnl": 1000}'),
  ('0x3333333333333333333333333333333333333333', 5, true, '{"win_rate": 0.61, "money_won": 8000, "money_lost": 5500, "total_pnl": 2500}'),
  ('0x4444444444444444444444444444444444444444', 8, true, '{"win_rate": 0.75, "money_won": 15000, "money_lost": 5000, "total_pnl": 10000}'),
  ('0x5555555555555555555555555555555555555555', 4, true, '{"win_rate": 0.48, "money_won": 4000, "money_lost": 6000, "total_pnl": -2000}'),
  ('0x6666666666666666666666666666666666666666', 3, true, '{"win_rate": 0.42, "money_won": 3000, "money_lost": 7000, "total_pnl": -4000}'),
  ('0x7777777777777777777777777777777777777777', 7, true, '{"win_rate": 0.68, "money_won": 10000, "money_lost": 4500, "total_pnl": 5500}'),
  ('0x8888888888888888888888888888888888888888', 6, true, '{"win_rate": 0.60, "money_won": 8500, "money_lost": 6000, "total_pnl": 2500}'),
  ('0x9999999999999999999999999999999999999999', 5, true, '{"win_rate": 0.55, "money_won": 6000, "money_lost": 5000, "total_pnl": 1000}')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO public.wallet (capital, total)
VALUES
  (1000, 1000),
  (5000, 5200),
  (2500, 2400)
ON CONFLICT DO NOTHING;

INSERT INTO public.trades (trade_name, icon, price, trade_score, position, status, user_copy)
VALUES
  ('Election 2028 Winner', 'icon1.png', 0.45, 9, 'YES', 'OPEN', '0x64d62f624dff82248a645bb8007f2c8b012c8795'),
  ('Bitcoin > 100k 2026', 'icon2.png', 0.62, 8, 'YES', 'OPEN', '0x1111111111111111111111111111111111111111'),
  ('ETH > 10k 2025', 'icon3.png', 0.33, 6, 'NO', 'CLOSED', '0x2222222222222222222222222222222222222222'),
  ('AI Regulation Passed', 'icon4.png', 0.51, 7, 'YES', 'OPEN', '0x3333333333333333333333333333333333333333'),
  ('Fed Rate Cut July', 'icon5.png', 0.74, 8, 'YES', 'OPEN', '0x4444444444444444444444444444444444444444'),
  ('War Ends 2026', 'icon6.png', 0.29, 5, 'NO', 'OPEN', '0x5555555555555555555555555555555555555555'),
  ('Tesla Hits 500', 'icon7.png', 0.40, 6, 'YES', 'CLOSED', '0x6666666666666666666666666666666666666666'),
  ('Apple New Product Success', 'icon8.png', 0.67, 7, 'YES', 'OPEN', '0x7777777777777777777777777777777777777777'),
  ('Recession 2025', 'icon9.png', 0.58, 6, 'YES', 'OPEN', '0x8888888888888888888888888888888888888888'),
  ('Gold > 3000', 'icon10.png', 0.49, 5, 'NO', 'OPEN', '0x9999999999999999999999999999999999999999'),
  ('Election 2028 Winner', 'icon1.png', 0.47, 9, 'YES', 'OPEN', '0x64d62f624dff82248a645bb8007f2c8b012c8795'),
  ('Bitcoin > 100k 2026', 'icon2.png', 0.65, 8, 'YES', 'OPEN', '0x1111111111111111111111111111111111111111'),
  ('ETH > 10k 2025', 'icon3.png', 0.30, 6, 'NO', 'CLOSED', '0x2222222222222222222222222222222222222222'),
  ('AI Regulation Passed', 'icon4.png', 0.53, 7, 'YES', 'OPEN', '0x3333333333333333333333333333333333333333'),
  ('Fed Rate Cut July', 'icon5.png', 0.70, 8, 'YES', 'OPEN', '0x4444444444444444444444444444444444444444'),
  ('War Ends 2026', 'icon6.png', 0.32, 5, 'NO', 'OPEN', '0x5555555555555555555555555555555555555555'),
  ('Tesla Hits 500', 'icon7.png', 0.42, 6, 'YES', 'CLOSED', '0x6666666666666666666666666666666666666666'),
  ('Apple New Product Success', 'icon8.png', 0.69, 7, 'YES', 'OPEN', '0x7777777777777777777777777777777777777777'),
  ('Recession 2025', 'icon9.png', 0.55, 6, 'YES', 'OPEN', '0x8888888888888888888888888888888888888888'),
  ('Gold > 3000', 'icon10.png', 0.50, 5, 'NO', 'OPEN', '0x9999999999999999999999999999999999999999')
ON CONFLICT DO NOTHING;