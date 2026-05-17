# Phase 2.2 Status - Auth Flow, Login Page, Authenticated Layout

## New Files Created

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/lib/supabase/client.js` | Browser Supabase client (factory function) |
| 2 | `src/lib/supabase/server.js` | Server Supabase client using next/headers cookies |
| 3 | `src/lib/supabase/proxy.js` | Proxy/middleware helper: refreshes session, redirects unauthenticated |
| 4 | `proxy.js` (project root) | Next.js 16 proxy (replaces deprecated middleware.js) |
| 5 | `src/app/login/page.jsx` | Login page (Server Component wrapper) |
| 6 | `src/app/login/LoginForm.jsx` | Login form (Client Component) with magic link OTP |
| 7 | `src/app/auth/callback/route.js` | Route Handler: exchanges magic link code for session |
| 8 | `src/components/Providers.jsx` | Client Component: QueryClientProvider + Toaster |
| 9 | `src/app/(authenticated)/layout.jsx` | Authenticated route group layout (Server Component) |
| 10 | `src/app/(authenticated)/page.jsx` | Placeholder home page inside authenticated group |
| 11 | `src/components/AppShell.jsx` | Client Component: sidebar + mobile nav (matches Layout.jsx.txt) |

## Updated Files

| File | Change |
|------|--------|
| `src/app/layout.js` | Wrapped children in `<Providers>` |

## Deleted Files

| File | Reason |
|------|--------|
| `src/app/page.js` | Replaced by `src/app/(authenticated)/page.jsx` |
| `src/lib/supabase.js` | Replaced by `src/lib/supabase/client.js` (+ server.js, proxy.js) |

## Deviations from Spec

1. **proxy.js instead of middleware.js**: Next.js 16 deprecated the `middleware` file
   convention and renamed it to `proxy`. The file is `proxy.js` at the project root
   with an exported `proxy()` function. Functionally identical to what the spec
   described for middleware.js.

2. **Supabase proxy helper named proxy.js**: The helper at `src/lib/supabase/proxy.js`
   was named to match the Next.js 16 convention (spec called it middleware.js).

3. **Sheet component for mobile nav**: The original Layout.jsx.txt used a plain overlay
   div for mobile nav. The new version uses the shadcn Sheet component (slide-in
   drawer from right) for better UX and accessibility. Nav items, labels, and order
   match 1:1.

## Auth Test Results

| Step | Test | Result |
|------|------|--------|
| a | localhost:3000 redirects to /login | PASS - 307 redirect to /login |
| b | Enter email, success message shows | READY FOR MANUAL TEST - form renders correctly, submit calls signInWithOtp |
| c | Click magic link, land on / with sidebar | READY FOR MANUAL TEST - auth/callback route handler exchanges code for session |
| d | Click nav items (Tasks, Surgeries, Videos) | READY FOR MANUAL TEST - links point to /tasks, /surgeries, /videos (404 expected) |
| e | AdminPanel link hidden for non-admin | BUILT - nav only shows admin items when profile.role === 'admin' |
| f | Click logout, back to /login | BUILT - calls supabase.auth.signOut() then router.push('/login') |

Steps b-f require manual browser testing with a real email (tomliba1996@gmail.com).
The proxy redirect (step a) has been verified via curl.

## Architecture Notes

- **Browser client**: `createClient()` factory (not singleton) per Supabase SSR docs
- **Server client**: reads/writes cookies via `next/headers` `cookies()` (async in Next.js 16)
- **Proxy helper**: `updateSession()` handles token refresh on every request, redirects
  unauthenticated users to /login, redirects authenticated users away from /login
- **QueryClient**: singleton with `refetchOnWindowFocus: false`, `retry: 1` (matches
  `../Wolfson/Src/Lib/query-client.js.txt`)
- **Authenticated layout**: Server Component fetches user + profile, passes to AppShell
- **AppShell nav items** match Layout.jsx.txt:10-18 in exact order and Hebrew labels
