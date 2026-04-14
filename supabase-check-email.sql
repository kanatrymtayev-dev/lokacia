-- Function to check if email exists in auth.users
-- Run this in Supabase SQL Editor

create or replace function public.check_email_exists(check_email text)
returns boolean as $$
begin
  return exists (select 1 from auth.users where email = check_email);
end;
$$ language plpgsql security definer;
