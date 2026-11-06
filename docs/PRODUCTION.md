# Production deployment

This checklist is the source of truth for taking BuyTheCrypto to `https://buythecrypto.com`. Nothing here has been approved or deployed by the application itself.

## 1. Repository

1. Create a GitHub repository and push this project.
2. Confirm `.env.local` is not committed. Only `.env.example` belongs in git.

## 2. Supabase

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, the publishable/anon key, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Set `DATABASE_URL` to the Supabase pooler connection string (`*.pooler.supabase.com`). The direct `db.<project>.supabase.co` host is IPv6-only and is not reachable from every host. Use port `6543` for the transaction pooler on Vercel, or port `5432` for session mode.
4. Run `npm run db:migrate`.
5. In Authentication, enable email/password and Google. Add `https://buythecrypto.com/auth/callback` and `https://www.buythecrypto.com/auth/callback` to the redirect allow list.
6. Confirm the `handle_new_user` trigger creates a profile and the `customer` role.
7. Grant the first administrator manually:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where email = 'you@example.com'
on conflict do nothing;
```

8. Enable Point-in-Time Recovery or scheduled backups in the Supabase project. The application cannot turn backups on for you.

## 3. Transak

Staging and production are separate.

| Environment | `TRANSAK_ENV` | API base | Gateway | Widget host returned by the API |
| --- | --- | --- | --- | --- |
| Staging | `staging` | `https://api-stg.transak.com` | `https://api-gateway-stg.transak.com` | `https://global-stg.transak.com` |
| Production | `production` | `https://api.transak.com` | `https://api-gateway.transak.com` | `https://global.transak.com` |

1. Create a partner account at the Transak dashboard and copy the staging API key and API secret into `TRANSAK_API_KEY` and `TRANSAK_API_SECRET`.
2. Set `TRANSAK_REFERRER_DOMAIN` to `buythecrypto.com`.
3. Whitelist the server egress IPs if Transak requires it for Create Widget URL. Vercel does not provide a stable egress IP on the standard plan, so confirm the current partner requirement before launch.
4. Complete KYB before requesting a production key.
5. After KYB, ask Transak to register the order webhook:
   - URL: `https://buythecrypto.com/api/transak/webhook`
   - Environment: staging first, then production
6. Do not run a real card payment until you explicitly decide to. Staging test credentials are documented by Transak at [How to Test Using Sandbox Credentials](https://docs.transak.com/guides/sandbox-credentials).
7. The access token from `POST /partners/api/v2/refresh-token` is the webhook HMAC secret. Refreshing it invalidates the previous token. The app stores the current and previous token when `DATABASE_URL` is set.

A browser `TRANSAK_ORDER_SUCCESSFUL` event only asks the server to refresh the order. It never writes `COMPLETED` by itself.

## 4. Vercel

1. Import the GitHub repository.
2. Framework preset: Next.js.
3. Add every variable from `.env.example` in the Vercel project. Use staging Transak values until KYB and webhook registration are finished.
4. Attach `buythecrypto.com`.
5. `vercel.json` permanently redirects `www.buythecrypto.com` to `https://buythecrypto.com`.
6. In Cloudflare DNS, point the apex and `www` at Vercel with the records Vercel displays. Proxying through Cloudflare is optional. If the proxy is enabled, use Full (strict) TLS.
7. Deploy with `git push`. Do not promote a production Transak key until staging checkout, webhook verification, and order history have been exercised.

## 5. Supporting services

| Service | Required for | Variables |
| --- | --- | --- |
| CoinGecko | Higher market-data rate limits | `COINGECKO_API_KEY`, `COINGECKO_API_KEY_TYPE` |
| Upstash Redis | Shared rate limits across serverless instances | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Inngest | Background order refresh after a webhook | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| Resend | Support email delivery | `RESEND_API_KEY`, `SUPPORT_EMAIL_FROM`, `SUPPORT_EMAIL_TO` |
| Sentry | Error reporting | `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` |
| PostHog | Product analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |

Without Upstash, rate limits are enforced in the instance memory. That is sufficient for local development and is not a substitute for Upstash in production. Without Inngest, the webhook handler refreshes the order inline.

## 6. Security and compliance checklist

- [ ] HTTPS on the canonical domain, with `www` redirected
- [ ] Service role key, Transak API secret, and webhook token exist only in server environment variables
- [ ] Supabase email verification is required
- [ ] Google OAuth redirect URLs match the deployed domain
- [ ] Row level security migration has been applied
- [ ] Administrator role was granted explicitly
- [ ] Webhook signature failures return 401 and are not processed
- [ ] Duplicate webhook deliveries do not create a second order update
- [ ] An older status cannot overwrite `COMPLETED` except for `REFUNDED`
- [ ] No card data, seed phrase, or private key field exists in the schema
- [ ] Stored webhook JSON omits IP address, card data, and bank details
- [ ] Customers can read only their own orders
- [ ] Admin reconcile calls Transak and does not set a status by hand
- [ ] Market data shows the retrieval time, including when a cached response is served
- [ ] Legal pages have been reviewed by counsel
- [ ] Transak KYB is approved before production keys are used
- [ ] Dependency review (`npm audit`) has been triaged
- [ ] Database backups are enabled in Supabase
- [ ] No real customer payment has been run without explicit authorization

## 7. Set these on the host before production traffic

The repository does not contain secrets. Copy the names from `.env.example` into the host project.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the pooler `DATABASE_URL`. Server queries use `DATABASE_URL`. `SUPABASE_SERVICE_ROLE_KEY` is reserved and is not required by the current server paths.
- `TRANSAK_ENV=staging`, `TRANSAK_API_KEY`, `TRANSAK_API_SECRET`, and `TRANSAK_REFERRER_DOMAIN=buythecrypto.com` until KYB is approved.
- Production Transak key, KYB approval, and webhook registration at `https://buythecrypto.com/api/transak/webhook`.
- Google OAuth inside Supabase, if that sign-in button should work, plus the deployed `/auth/callback` redirect.
- CoinGecko, Upstash, Inngest, Resend, Sentry, and PostHog keys when those features should be active. The app runs without them.
- DNS for `buythecrypto.com`.
- Counsel review of the terms, privacy, and risk pages.
- Confirmation that the deployed host can reach `api-stg.transak.com`. Transak's Cloudflare configuration can block some egress addresses before the API key is checked.
