# BuyTheCrypto

BuyTheCrypto is a non-custodial cryptocurrency purchasing application. Customers browse CoinGecko market data, sign in with Supabase Auth, and complete a fiat-to-crypto purchase in the Transak widget. BuyTheCrypto does not hold fiat, cryptocurrency, card details, or private keys.

Version 1 uses the current Transak flow:

- Partner access tokens are created with `POST /partners/api/v2/refresh-token`.
- Widget URLs are created on the server with `POST /api/v2/auth/session`.
- Quotes, assets, fiat currencies, and wallet checks use the public Transak endpoints documented at [docs.transak.com](https://docs.transak.com).
- Order webhooks are JWT payloads in the `data` field, verified with the partner access token using `HS256`.
- An order is not marked successful from a browser callback. The widget can only attach a Transak order id. Status changes come from a verified webhook or from `GET /partners/api/v2/order/{orderId}`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Public pages and CoinGecko market data work without the other credentials. Sign-in, checkout, webhooks, and dashboards need the services below.

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply `supabase/migrations` using `DATABASE_URL` |
| `npm test` | Vitest unit tests with mocked provider payloads |
| `npm run test:e2e` | Playwright coverage of public pages, mobile navigation, and auth protection |

## Architecture

- `src/app` — App Router pages and route handlers
- `src/lib/onramp` — on-ramp provider interface. Transak is the only implementation
- `src/lib/transak` — token handling, widget parameters, quotes, and webhook verification
- `src/lib/orders` — status ranking, idempotent reconciliation, and provider refresh
- `src/db` — Drizzle schema matching the SQL migration
- `supabase/migrations/0001_init.sql` — tables, signup trigger, and row level security

Additional on-ramps should implement `OnRampProvider` instead of calling Transak from the UI.

## Production deployment

Import this repository into the host and set the variables in [docs/PRODUCTION.md](docs/PRODUCTION.md) before accepting customer payments. The repository does not create Supabase, Vercel, DNS, or Transak production resources on its own.
