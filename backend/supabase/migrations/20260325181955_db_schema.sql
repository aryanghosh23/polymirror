CREATE TABLE traders (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    added_date TIMESTAMP DEFAULT NOW(),
    still_monitoring BOOLEAN DEFAULT TRUE,
    trusted_score NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE wallet (
    id BIGSERIAL PRIMARY KEY,
    capital NUMERIC(18,2) NOT NULL DEFAULT 0,
    total NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE trades (
    id BIGSERIAL PRIMARY KEY,
    user_copy TEXT NOT NULL,
    trade_name TEXT,
    icon TEXT,
    price NUMERIC(18,8),
    created_at TIMESTAMP DEFAULT NOW()
);