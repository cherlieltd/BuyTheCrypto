-- BuyTheCrypto initial schema.
-- Apply in the Supabase SQL editor or with: npm run db:migrate

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.crypto_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'transak',
  provider_order_id text,
  fiat_currency text not null,
  fiat_amount numeric(18, 2) not null,
  crypto_currency text not null,
  crypto_amount numeric(36, 18),
  blockchain_network text not null,
  wallet_address text not null,
  status text not null,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crypto_orders_user_created_idx
  on public.crypto_orders (user_id, created_at desc);

create unique index if not exists crypto_orders_provider_order_idx
  on public.crypto_orders (provider, provider_order_id)
  where provider_order_id is not null;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists public.crypto_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  slug text not null unique,
  image_url text,
  network text not null,
  is_active boolean not null default true,
  coingecko_id text
);

create table if not exists public.market_price_cache (
  asset_id text not null,
  currency text not null,
  price numeric(36, 12) not null,
  market_cap numeric(36, 2),
  volume_24h numeric(36, 2),
  change_24h numeric(12, 4),
  updated_at timestamptz not null default now(),
  primary key (asset_id, currency)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_tokens (
  provider text primary key,
  access_token text not null,
  previous_access_token text,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

insert into public.faqs (question, answer, sort_order)
select * from (
  values
    (
      'Who processes my purchase?',
      'BuyTheCrypto does not hold customer fiat, cryptocurrency, card details, or private keys. Checkout, identity verification, and crypto delivery are handled by Transak, our integrated on-ramp partner.',
      1
    ),
    (
      'Which countries and payment methods are available?',
      'Availability depends on Transak coverage for your location, the selected asset, and the payment method. The buy flow only lists options returned by Transak for the configured environment.',
      2
    ),
    (
      'When is an order marked completed?',
      'An order is shown as completed only after BuyTheCrypto verifies a Transak webhook or refreshes the order from the Transak partner API. A browser event from the checkout widget is not treated as proof of payment or delivery.',
      3
    ),
    (
      'Where is cryptocurrency sent?',
      'You provide an external wallet address that you control. BuyTheCrypto does not create a custodial wallet and does not ask for a seed phrase or private key.',
      4
    )
) as seed(question, answer, sort_order)
where not exists (select 1 from public.faqs);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists crypto_orders_set_updated_at on public.crypto_orders;
create trigger crypto_orders_set_updated_at
before update on public.crypto_orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  insert into public.profiles (auth_user_id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        updated_at = now()
  returning id into new_profile_id;

  insert into public.user_roles (user_id, role)
  values (new_profile_id, 'customer')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.crypto_orders enable row level security;
alter table public.webhook_events enable row level security;
alter table public.crypto_assets enable row level security;
alter table public.market_price_cache enable row level security;
alter table public.support_tickets enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;
alter table public.provider_tokens enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where p.auth_user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists roles_select_own on public.user_roles;
create policy roles_select_own on public.user_roles
for select to authenticated
using (
  user_id in (select id from public.profiles where auth_user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists orders_select_own on public.crypto_orders;
create policy orders_select_own on public.crypto_orders
for select to authenticated
using (
  user_id in (select id from public.profiles where auth_user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists assets_public_read on public.crypto_assets;
create policy assets_public_read on public.crypto_assets
for select to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists prices_public_read on public.market_price_cache;
create policy prices_public_read on public.market_price_cache
for select to anon, authenticated
using (true);

drop policy if exists faqs_public_read on public.faqs;
create policy faqs_public_read on public.faqs
for select to anon, authenticated
using (published = true or public.is_admin());

drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings
for select to anon, authenticated
using (key in ('announcement'));

drop policy if exists tickets_select_own on public.support_tickets;
create policy tickets_select_own on public.support_tickets
for select to authenticated
using (
  user_id in (select id from public.profiles where auth_user_id = auth.uid())
  or public.is_admin()
);

drop policy if exists tickets_insert_own on public.support_tickets;
create policy tickets_insert_own on public.support_tickets
for insert to authenticated
with check (
  user_id in (select id from public.profiles where auth_user_id = auth.uid())
);

-- Privileged tables have RLS enabled and no policies for anon/authenticated.
-- The Next.js server uses the database connection, which bypasses RLS, only after its own authorization checks.
