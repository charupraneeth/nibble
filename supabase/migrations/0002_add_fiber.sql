-- Add fiber tracking to food_logs
ALTER TABLE food_logs
  ADD COLUMN fiber numeric,
  ADD COLUMN fiber_estimated boolean DEFAULT false;

-- Add fiber target to profiles
ALTER TABLE profiles
  ADD COLUMN target_fiber numeric;
