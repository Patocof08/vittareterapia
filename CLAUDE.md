# CLAUDE.md — Vittare Terapia

## What Is This Project?

Vittare Terapia is a **therapy marketplace platform** that connects psychologists with clients in Latin America. Everything is in Spanish. Currency is MXN (Mexican Pesos).

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres database, Auth, Edge Functions, Storage, Realtime)
- **Forms:** react-hook-form + Zod (Zod schemas exist but are NOT yet connected to forms)
- **State:** React Context (useAuth). React Query is installed but NOT used yet.

## Project Structure

```
src/
├── pages/
│   ├── client/        # Client portal (booking, sessions, payments, messages)
│   ├── therapist/     # Therapist panel (calendar, patients, reports, wallet)
│   ├── admin/         # Admin dashboard (verifications, financials)
│   ├── onboarding/    # 5-step psychologist onboarding (Step1-Step5)
│   ├── Auth.tsx        # Login / Register page
│   ├── Index.tsx       # Landing page
│   ├── Therapists.tsx  # Public therapist directory
│   └── ...            # Blog, FAQ, Contact, Pricing, Privacy, Terms
├── components/
│   ├── client/        # ClientLayout, ClientSidebar, BookingCalendar
│   ├── therapist/     # TherapistLayout, TherapistSidebar, AvailabilityEditor
│   ├── admin/         # AdminLayout, AdminSidebar
│   ├── ui/            # 49 shadcn/ui components (don't modify these)
│   ├── ProtectedRoute.tsx
│   └── ...
├── hooks/
│   ├── useAuth.tsx     # Auth context provider (login, signup, roles)
│   └── useOnboarding.tsx
├── integrations/supabase/
│   ├── client.ts       # Supabase client initialization
│   └── types.ts        # Auto-generated DB types (NEEDS REGENERATION)
├── lib/
│   ├── validation.ts       # Zod schemas (NOT connected to forms yet)
│   ├── logger.ts           # Production-safe error logging
│   ├── matchingAlgorithm.ts # Client-therapist matching
│   ├── psychologistQueries.ts # Secure public profile queries
│   └── utils.ts
└── types/
    └── preferences.ts

supabase/
├── migrations/        # 40 SQL migrations (ordered by date)
└── functions/
    ├── delete-user-account/    # Account deletion with financial cleanup
    ├── renew-subscriptions-cron/ # Monthly subscription renewals
    └── expire-credits-cron/    # Expire unused session credits
```

## Three User Roles

| Role | Route | Description |
|------|-------|-------------|
| `cliente` | `/portal/*` | Books sessions, messages therapist, manages payments |
| `psicologo` | `/therapist/*` | Manages calendar, patients, documents, wallet |
| `admin` | `/admin/*` | Verifies psychologists, views financial dashboards |

Roles are stored in `user_roles` table. The `app_role` enum has: `psicologo`, `cliente`, `admin`.

## Financial Model

- Clients buy **session packages** (subscriptions)
- Money goes into **deferred revenue** when purchased
- When a session is completed: **85% goes to psychologist wallet, 15% to admin wallet**
- Unused sessions can **roll over 25%** on renewal
- All changes are logged in `wallet_transactions` for audit

## Key Database Tables

- `user_roles` — maps user_id to role
- `profiles` — basic user info (auto-created on signup)
- `psychologist_profiles` — therapist details, verification status
- `psychologist_availability` — weekly schedule slots
- `psychologist_pricing` — session prices by modality
- `psychologist_documents` — uploaded licenses/IDs (signed URLs)
- `appointments` — booked sessions
- `client_subscriptions` — active packages with session counts
- `deferred_revenue` — money waiting to be split
- `admin_wallet` / `psychologist_wallets` — current balances
- `wallet_transactions` — full audit trail
- `conversations` / `messages` — client-therapist messaging
- `session_clinical_notes` — therapist notes per session
- `client_credits` — credits from cancellations
- `payments` — payment records

## Security Functions (SECURITY DEFINER)

- `has_role(user_id, role)` — checks if user has a specific role
- `get_user_role(user_id)` — returns user's role
- `recognize_session_revenue(appointment_id)` — splits deferred revenue 85/15
- `create_deferred_revenue(...)` — creates deferred entry when package purchased
- `process_package_purchase(...)` — handles full package purchase flow

## Rules

- **Always create Supabase migrations** for database changes — never modify the DB directly
- **Never modify files in `src/components/ui/`** — these are shadcn/ui components
- **All user-facing text must be in Spanish**
- **Use `has_role()` function** in RLS policies, not client-side checks
- **Supabase client uses env vars** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Run `npm run build`** after changes to verify no TypeScript errors
- **Financial operations must use SECURITY DEFINER functions** — never direct client writes

## Known Issues to Fix (Priority Order)

### 🔴 CRITICAL — Fix First

1. **Wildcard RLS on financial tables** — `deferred_revenue`, `admin_wallet`, `psychologist_wallets`, `wallet_transactions` all have `WITH CHECK (true)` INSERT/UPDATE policies. Any authenticated user can manipulate financial data. Replace with role-based restrictions or remove client-side write access entirely.

2. **Admin role self-assignment** — Users choose their own role at signup and insert it into `user_roles`. Nothing prevents inserting `admin`. Add a database trigger that blocks `admin` role insertion unless the inserter is already an admin.

### 🟡 HIGH — Fix Next

3. **Zod validation not connected** — Schemas exist in `src/lib/validation.ts` but are not integrated with the onboarding forms. Connect them using react-hook-form's `zodResolver`.

4. **Fake password reset** — `handleForgotPassword` in `Auth.tsx` only shows a toast but doesn't call `supabase.auth.resetPasswordForEmail()`.

5. **48 @ts-ignore directives** — The Supabase types file is out of date. Regenerate types and fix actual type errors.

6. **No React Error Boundaries** — Any component crash white-screens the app.

7. **React Query installed but unused** — All data fetching uses raw useEffect/useState. Migrate to useQuery/useMutation.

### 🟠 MEDIUM — Improve Later

8. **Delete account has no transaction** — The edge function does 20+ sequential DB operations without a transaction wrapper.

9. **Auth loading race condition** — `loading` is only set to `false` in `getSession()` callback, not in `onAuthStateChange`.

10. **CORS wildcard on Edge Functions** — Should be restricted to production domain.

11. **Dual lockfiles** — Both `bun.lockb` and `package-lock.json` exist. Pick npm and remove `bun.lockb`.

12. **Subscription renewal has no real payment processing** — Currently creates `completed` payment records without actual payment gateway integration.
