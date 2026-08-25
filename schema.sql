create extension if not exists "uuid-ossp";

create type public.user_role as enum ('owner','admin','jips');
create type public.order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'jips',
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  sector text not null default 'books',
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text default '',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  age_group text,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  featured boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  district text,
  area text,
  notes text,
  delivery_fee numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending',
  status public.order_status not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  created_at timestamptz default now()
);

-- Starter categories
insert into public.categories(name,slug,sector) values
('Story Books','story-books','books'),
('Educational Books','educational-books','books'),
('Sensory & Learning','sensory-learning','books'),
('Activity Books','activity-books','books')
on conflict (slug) do nothing;

-- Enable RLS before production and add policies matching your role rules.
