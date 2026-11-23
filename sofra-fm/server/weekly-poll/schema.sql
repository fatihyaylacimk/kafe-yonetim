CREATE SCHEMA IF NOT EXISTS sofra_poll;

CREATE TABLE IF NOT EXISTS sofra_poll.rounds (
  id date PRIMARY KEY,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  left_drink text NOT NULL,
  right_drink text NOT NULL,
  CHECK (opens_at < closes_at),
  CHECK (left_drink <> right_drink),
  EXCLUDE USING gist (tstzrange(opens_at, closes_at, '[)') WITH &&)
);

CREATE TABLE IF NOT EXISTS sofra_poll.ballots (
  round_id date NOT NULL REFERENCES sofra_poll.rounds (id),
  voter_hash text NOT NULL CHECK (length(voter_hash) = 64),
  choice smallint NOT NULL CHECK (choice IN (0, 1)),
  PRIMARY KEY (round_id, voter_hash)
);
