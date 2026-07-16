-- DevClan AI Calling Dashboard — database schema
-- Run this once against your Postgres database before first use.
-- (The included `npm run db:init` script does this for you automatically.)

create extension if not exists "pgcrypto";

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text not null unique,
  email text,
  company text,
  source text default 'manual',           -- 'manual' | 'apollo' | 'import'
  stage text default 'new',                -- 'new' | 'attempted' | 'booked' | 'won' | 'lost'
  opted_out boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  retell_call_id text unique,
  direction text default 'outbound',
  from_number text,
  to_number text,
  status text,                             -- 'registered' | 'ongoing' | 'ended' | 'error'
  disconnection_reason text,
  duration_seconds integer,
  transcript text,
  call_summary text,
  call_successful boolean,
  user_sentiment text,
  interest_level text,                     -- 'Hot' | 'Warm' | 'Cold'
  call_outcome text,                       -- 'Booked' | 'Not Interested' | 'Callback' | 'Voicemail'
  objections text,
  budget_mentioned text,
  opted_out boolean default false,
  recording_url text,
  raw_payload jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  call_id uuid references calls(id) on delete set null,
  title text default 'Discovery Call',
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'confirmed',         -- 'confirmed' | 'completed' | 'no_show' | 'cancelled'
  notes text,
  created_at timestamptz default now()
);

-- Weekly recurring availability, e.g. Mon-Fri 9am-5pm.
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null,            -- 0 = Sunday ... 6 = Saturday
  start_time time not null,
  end_time time not null,
  slot_minutes integer default 30,
  timezone text default 'Asia/Karachi',
  active boolean default true
);

-- One-off exceptions: block a date, or add extra hours on a specific day.
create table if not exists availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  is_blocked boolean default true,         -- true = fully unavailable that date
  start_time time,
  end_time time,
  note text
);

create index if not exists idx_calls_contact on calls(contact_id);
create index if not exists idx_appointments_contact on appointments(contact_id);
create index if not exists idx_appointments_start on appointments(start_time);
create index if not exists idx_contacts_phone on contacts(phone);
