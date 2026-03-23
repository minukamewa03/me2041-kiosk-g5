create table public.kiosk_scans (
  id uuid not null default gen_random_uuid(),
  rfid_tag text not null,
  scanned_at timestamp with time zone not null default now(),
  constraint kiosk_scans_pkey primary key (id)
);

-- Enable RLS
alter table public.kiosk_scans enable row level security;

-- Allow anyone to insert (ESP32)
create policy "Enable insert for anonymous users" on public.kiosk_scans
  for insert
  with check (true);

-- Allow anyone to read (Kiosk Frontend)
create policy "Enable read access for all users" on public.kiosk_scans
  for select
  using (true);

-- Turn on realtime for this table
alter publication supabase_realtime add table public.kiosk_scans;
