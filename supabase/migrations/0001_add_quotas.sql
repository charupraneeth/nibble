-- Create user_quotas table to track daily usage
create table if not exists user_quotas (
  user_id uuid references auth.users not null primary key,
  date date not null default current_date,
  count int not null default 0,
  last_updated timestamptz default now()
);

-- Enable RLS
alter table user_quotas enable row level security;

-- Policies
-- Users can read their own quota
create policy "Users can read own quota"
  on user_quotas for select
  using (auth.uid() = user_id);

-- Only service role can update quota (Edge function)
-- But effectively, if we want the edge function to update it securely, it uses the service_role key.
-- Standard users should NOT be able to update their own quota count directly.
