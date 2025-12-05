-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  name text,
  height numeric,
  weight numeric,
  age integer,
  gender text,
  goal text,
  activity_level text,
  dietary_preferences text[],
  target_calories numeric,
  target_protein numeric,
  target_carbs numeric,
  target_fat numeric,
  updated_at timestamp with time zone
);

-- Create food_logs table
create table food_logs (
  id text not null, -- Client generated ID for now, or use uuid default gen_random_uuid()
  user_id uuid references auth.users not null,
  date text not null, -- YYYY-MM-DD
  name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  weight numeric not null,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table food_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Food logs policies
create policy "Users can view own logs" on food_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own logs" on food_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own logs" on food_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete own logs" on food_logs
  for delete using (auth.uid() = user_id);
