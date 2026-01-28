create extension if not exists "pgcrypto";

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  paid_by_participant_id uuid references participants(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists expense_splits (
  expense_id uuid not null references expenses(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  primary key (expense_id, participant_id)
);

create index if not exists expense_splits_participant_id_idx
  on expense_splits (participant_id);
