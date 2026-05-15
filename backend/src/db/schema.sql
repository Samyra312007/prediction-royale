-- Prediction Market Battle Royale - PostgreSQL Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS games (
    id                  SERIAL PRIMARY KEY,
    contract_address    VARCHAR(42) NOT NULL UNIQUE,
    factory_game_id     INTEGER NOT NULL,
    state               VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    stake_amount_wei    NUMERIC(78, 0) NOT NULL,
    max_players         INTEGER NOT NULL,
    current_players     INTEGER NOT NULL DEFAULT 0,
    round_count         INTEGER NOT NULL,
    elimination_percent INTEGER NOT NULL,
    oracle_feed         VARCHAR(42) NOT NULL,
    oracle_asset        VARCHAR(20),
    current_round       INTEGER DEFAULT 0,
    prize_pool_wei      NUMERIC(78, 0) DEFAULT 0,
    winner_address      VARCHAR(42),
    created_at          TIMESTAMP DEFAULT NOW(),
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    tx_hash_created     VARCHAR(66),
    tx_hash_completed   VARCHAR(66)
);

CREATE TABLE IF NOT EXISTS players (
    id              SERIAL PRIMARY KEY,
    wallet_address  VARCHAR(42) NOT NULL UNIQUE,
    ens_name        VARCHAR(100),
    total_games     INTEGER DEFAULT 0,
    total_wins      INTEGER DEFAULT 0,
    total_earned_wei NUMERIC(78, 0) DEFAULT 0,
    win_rate        DECIMAL(5, 2) DEFAULT 0.00,
    accuracy_rate   DECIMAL(5, 2) DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_active     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_participants (
    id              SERIAL PRIMARY KEY,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id       INTEGER REFERENCES players(id) ON DELETE CASCADE,
    wallet_address  VARCHAR(42) NOT NULL,
    joined_at       TIMESTAMP DEFAULT NOW(),
    is_eliminated   BOOLEAN DEFAULT FALSE,
    eliminated_round INTEGER,
    final_rank      INTEGER,
    total_score     INTEGER DEFAULT 0,
    payout_wei      NUMERIC(78, 0) DEFAULT 0,
    payout_claimed  BOOLEAN DEFAULT FALSE,
    badge_minted    BOOLEAN DEFAULT FALSE,
    join_tx_hash    VARCHAR(66),
    claim_tx_hash   VARCHAR(66),
    UNIQUE(game_id, player_id)
);

CREATE TABLE IF NOT EXISTS rounds (
    id              SERIAL PRIMARY KEY,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    question_text   TEXT,
    question_type   VARCHAR(20) DEFAULT 'BINARY',
    target_value    NUMERIC(20, 8),
    oracle_feed     VARCHAR(42),
    baseline_price  NUMERIC(20, 8),
    resolved_price  NUMERIC(20, 8),
    correct_answer  BOOLEAN,
    commit_start    TIMESTAMP NOT NULL,
    commit_end      TIMESTAMP NOT NULL,
    reveal_start    TIMESTAMP,
    reveal_end      TIMESTAMP,
    resolved_at     TIMESTAMP,
    is_resolved     BOOLEAN DEFAULT FALSE,
    players_at_start INTEGER,
    players_eliminated INTEGER DEFAULT 0,
    resolve_tx_hash VARCHAR(66),
    UNIQUE(game_id, round_number)
);

CREATE TABLE IF NOT EXISTS predictions (
    id                  SERIAL PRIMARY KEY,
    round_id            INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    game_id             INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id           INTEGER REFERENCES players(id) ON DELETE CASCADE,
    wallet_address      VARCHAR(42) NOT NULL,
    commitment_hash     VARCHAR(66) NOT NULL,
    predicted_value     NUMERIC(20, 8),
    predicted_direction BOOLEAN,
    is_committed        BOOLEAN DEFAULT FALSE,
    is_revealed         BOOLEAN DEFAULT FALSE,
    is_correct          BOOLEAN,
    score_earned        INTEGER DEFAULT 0,
    submitted_at        TIMESTAMP,
    revealed_at         TIMESTAMP,
    commit_tx_hash      VARCHAR(66),
    reveal_tx_hash      VARCHAR(66),
    UNIQUE(round_id, player_id)
);

CREATE TABLE IF NOT EXISTS round_scores (
    id              SERIAL PRIMARY KEY,
    round_id        INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id       INTEGER REFERENCES players(id) ON DELETE CASCADE,
    wallet_address  VARCHAR(42) NOT NULL,
    score_this_round INTEGER DEFAULT 0,
    cumulative_score INTEGER DEFAULT 0,
    rank_this_round  INTEGER,
    is_eliminated    BOOLEAN DEFAULT FALSE,
    UNIQUE(round_id, player_id)
);

CREATE TABLE IF NOT EXISTS nft_badges (
    id              SERIAL PRIMARY KEY,
    token_id        INTEGER NOT NULL UNIQUE,
    wallet_address  VARCHAR(42) NOT NULL,
    game_id         INTEGER REFERENCES games(id),
    final_rank      INTEGER,
    rounds_survived INTEGER,
    payout_wei      NUMERIC(78, 0) DEFAULT 0,
    minted_at       TIMESTAMP DEFAULT NOW(),
    tx_hash         VARCHAR(66),
    metadata_uri    TEXT
);

CREATE TABLE IF NOT EXISTS price_snapshots (
    id              SERIAL PRIMARY KEY,
    oracle_feed     VARCHAR(42) NOT NULL,
    asset_pair      VARCHAR(20) NOT NULL,
    price           NUMERIC(20, 8) NOT NULL,
    round_id        INTEGER REFERENCES rounds(id),
    snapshot_type   VARCHAR(20),
    block_number    INTEGER,
    recorded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_contract ON games(contract_address);
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_gp_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_gp_player ON game_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_rounds_game ON rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_rounds_resolved ON rounds(is_resolved);
CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id);
CREATE INDEX IF NOT EXISTS idx_scores_round ON round_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_badges_wallet ON nft_badges(wallet_address);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE round_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
