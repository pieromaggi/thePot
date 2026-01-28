create table if not exists pots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

alter table participants
  add column if not exists pot_id uuid references pots(id) on delete cascade;

alter table contributions
  add column if not exists pot_id uuid references pots(id) on delete cascade;

alter table expenses
  add column if not exists pot_id uuid references pots(id) on delete cascade;

alter table expense_splits
  add column if not exists pot_id uuid references pots(id) on delete cascade;

create index if not exists participants_pot_id_idx on participants (pot_id);
create index if not exists contributions_pot_id_idx on contributions (pot_id);
create index if not exists expenses_pot_id_idx on expenses (pot_id);
create index if not exists expense_splits_pot_id_idx on expense_splits (pot_id);
