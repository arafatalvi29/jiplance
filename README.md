# JIPLANCE Phase 2

Full-stack starter for JIPLANCE BOOKS with JIPLANCE FASHION coming soon.

## Stack
- Next.js + TypeScript
- Supabase (Auth + Postgres + Storage)
- Tailwind CSS

## Quick setup
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
3. Run `npm install`
4. Run `npm run dev`
5. In Supabase SQL Editor, run `supabase/schema.sql`.

## Roles
- owner: full control
- admin: full operational access
- jips: limited operational access

## Important
This starter includes the database schema and role model. Configure Row Level Security and create your first owner account before production use.
