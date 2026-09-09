# JIPLANCE v1

Fresh Next.js storefront foundation for JIPLANCE Books, with JIPLANCE Fashion reserved for a later launch.

## Included
- Responsive homepage
- Books shop + category filters
- Product pages
- LocalStorage cart
- Wishlist toggle
- Checkout UI
- bKash / Nagad manual-payment flow placeholder
- Bangladesh delivery pricing config
- Bangla/English toggle shell
- Fashion Coming Soon page
- Contact/About/Shipping/Returns pages
- Account/Admin placeholders
- Supabase client bootstrap
- Supabase SQL schema blueprint

## Important launch defaults
Open `lib/config.ts` to change:
- Dhaka delivery fee (currently set to 80)
- Outside Dhaka fee (120)
- COD on/off (currently off)
- Contact details
- Default language

## Local setup
1. Install Node.js 20+
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Add Supabase URL + anon key later
5. Run `npm run dev`

## Deployment
Recommended: GitHub + Vercel.

Do NOT reuse the old broken repository structure. Upload this project as a fresh repository or replace the old repository only after backing it up.
