# Phase 2.1 Status - Bootstrap Complete

## Project File Tree

```
wolfson_rebuild/
  .env.local
  .gitignore
  components.json
  eslint.config.mjs
  jsconfig.json
  next.config.mjs
  package.json
  package-lock.json
  postcss.config.mjs
  tailwind.config.js
  public/
    file.svg
    globe.svg
    next.svg
    vercel.svg
    window.svg
  src/
    app/
      favicon.ico
      globals.css
      layout.js
      page.js
    components/
      shared/
        MonthlyReportPDF.jsx
        ProgressRing.jsx
        StatCard.jsx
        SurgerySteps.jsx
      surgery/
        StepsSummary.jsx
        SurgeryCard.jsx
        SurgeryForm.jsx
      tasks/
        TaskList.jsx
        WetLabPractice.jsx
      ui/
        accordion.jsx
        alert.jsx
        alert-dialog.jsx
        aspect-ratio.jsx
        avatar.jsx
        badge.jsx
        breadcrumb.jsx
        button.jsx
        calendar.jsx
        card.jsx
        carousel.jsx
        chart.jsx
        checkbox.jsx
        collapsible.jsx
        command.jsx
        context-menu.jsx
        dialog.jsx
        drawer.jsx
        dropdown-menu.jsx
        form.jsx
        hover-card.jsx
        input.jsx
        input-otp.jsx
        label.jsx
        menubar.jsx
        navigation-menu.jsx
        pagination.jsx
        popover.jsx
        progress.jsx
        radio-group.jsx
        resizable.jsx
        scroll-area.jsx
        select.jsx
        separator.jsx
        sheet.jsx
        sidebar.jsx
        skeleton.jsx
        slider.jsx
        sonner.jsx
        switch.jsx
        table.jsx
        tabs.jsx
        textarea.jsx
        toast.jsx
        toaster.jsx
        toggle.jsx
        toggle-group.jsx
        tooltip.jsx
        use-toast.jsx
      video/
        UserNotRegisteredError.jsx
        VideoCard.jsx
        VideoForm.jsx
    hooks/
      use-mobile.jsx
    lib/
      supabase.js
      utils.js
    utils/
      index.js
```

## Dependencies Installed (npm list --depth=0)

```
wolfson_rebuild@0.1.0
+-- @radix-ui/react-accordion@1.2.12
+-- @radix-ui/react-alert-dialog@1.1.15
+-- @radix-ui/react-aspect-ratio@1.1.8
+-- @radix-ui/react-avatar@1.1.11
+-- @radix-ui/react-checkbox@1.3.3
+-- @radix-ui/react-collapsible@1.1.12
+-- @radix-ui/react-context-menu@2.2.16
+-- @radix-ui/react-dialog@1.1.15
+-- @radix-ui/react-dropdown-menu@2.1.16
+-- @radix-ui/react-hover-card@1.1.15
+-- @radix-ui/react-label@2.1.8
+-- @radix-ui/react-menubar@1.1.16
+-- @radix-ui/react-navigation-menu@1.2.14
+-- @radix-ui/react-popover@1.1.15
+-- @radix-ui/react-progress@1.1.8
+-- @radix-ui/react-radio-group@1.3.8
+-- @radix-ui/react-scroll-area@1.2.10
+-- @radix-ui/react-select@2.2.6
+-- @radix-ui/react-separator@1.1.8
+-- @radix-ui/react-slider@1.3.6
+-- @radix-ui/react-slot@1.2.4
+-- @radix-ui/react-switch@1.2.6
+-- @radix-ui/react-tabs@1.1.13
+-- @radix-ui/react-toast@1.2.15
+-- @radix-ui/react-toggle@1.1.10
+-- @radix-ui/react-toggle-group@1.1.11
+-- @radix-ui/react-tooltip@1.2.8
+-- @supabase/ssr@0.10.3
+-- @supabase/supabase-js@2.105.4
+-- @tanstack/react-query@5.100.10
+-- @tanstack/react-query-devtools@5.100.10
+-- autoprefixer@10.5.0
+-- class-variance-authority@0.7.1
+-- clsx@2.1.1
+-- cmdk@1.1.1
+-- date-fns@3.6.0
+-- embla-carousel-react@8.6.0
+-- eslint@9.39.4
+-- eslint-config-next@16.2.6
+-- framer-motion@11.18.2
+-- html2canvas@1.4.1
+-- input-otp@1.4.2
+-- jspdf@4.2.1
+-- lucide-react@0.475.0
+-- next@16.2.6
+-- postcss@8.5.14
+-- react@19.2.4
+-- react-day-picker@8.10.2
+-- react-dom@19.2.4
+-- react-hook-form@7.76.0
+-- react-resizable-panels@2.1.9
+-- recharts@2.15.4
+-- sonner@2.0.7
+-- tailwind-merge@3.6.0
+-- tailwindcss@3.4.19
+-- tailwindcss-animate@1.0.7
+-- vaul@1.1.2
+-- xlsx@0.18.5
```

## Deviations from Spec

1. **Tailwind downgraded to v3**: Next.js 16 scaffolds Tailwind v4 by default.
   The original project uses Tailwind v3 with `tailwind.config.js` (CommonJS
   `module.exports`), CSS-variable-based colors, and the `tailwindcss-animate`
   plugin. All of these are v3-only patterns. Downgraded to `tailwindcss@3.4.19`
   and installed `postcss` + `autoprefixer` as devDependencies. Updated
   `postcss.config.mjs` to use `tailwindcss` and `autoprefixer` plugins instead
   of `@tailwindcss/postcss`.

2. **`isIframe` export dropped from `src/lib/utils.js`**: The original
   `../Wolfson/Src/Lib/utils.js.txt` exports `isIframe = window.self !== window.top`.
   This references `window` at module scope, which would break in Next.js server-
   side rendering. Per ANALYSIS.md section 9, this value is not used by any
   component. Dropped it.

3. **`react-router-dom` not installed**: Listed as "Yes - used" in ANALYSIS.md
   for the original Vite + React Router app. In the rebuild we use Next.js App
   Router instead, so react-router-dom is not needed. The `createPageUrl` utility
   in `src/utils/index.js` was kept (it returns `'/PageName'` style paths) and
   will be used with Next.js `<Link>` in Phase 2.2.

4. **`utils/index.js` converted from TypeScript**: The original is
   `index.ts.txt` with a TypeScript type annotation on the parameter. Converted
   to plain JavaScript by removing `: string` from the function signature.

5. **`components.json` css path updated**: Changed from `src/index.css` (Vite
   convention) to `src/app/globals.css` (Next.js App Router convention).

6. **Heebo font added**: The original had no explicit font loading (relied on
   system fonts). The rebuild loads Heebo via `next/font/google` with
   weights [400, 500, 700] and subsets ["hebrew", "latin"] for proper Hebrew
   rendering and font optimization.

7. **`src/hooks/use-mobile.jsx` copied**: This file was included because it is
   imported by `src/components/ui/sidebar.jsx` (the shadcn sidebar component).

## Files Not Copied (by design, per spec)

- `../Wolfson/Src/pages/*` -- will become Next.js App Router pages in Phase 2.2
- `../Wolfson/Src/App.jsx.txt` -- replaced by Next.js `src/app/layout.js`
- `../Wolfson/Src/Layout.jsx.txt` -- will be rebuilt as a Next.js layout component in Phase 2.2
- `../Wolfson/Src/main.jsx.txt` -- not needed (Next.js has its own entry point)
- `../Wolfson/Src/Lib/AuthContext.jsx.txt` -- will be rebuilt with Supabase Auth in Phase 2.2
- `../Wolfson/Src/API.txt` -- replaced by `src/lib/supabase.js`
- `../Wolfson/Src/pages.config.js.txt` -- routing handled by Next.js file system
- `../Wolfson/Src/Lib/app-params.js.txt` (and its real content in New Text Document.txt) -- Base44-specific, replaced by `.env.local` + Supabase client
- `../Wolfson/Src/Lib/PageNotFound.jsx.txt` -- will become `not-found.js` in Phase 2.2
- `../Wolfson/Src/Lib/query-client.js.txt` -- will be recreated with providers in Phase 2.2

## Verification

- `npm run dev` starts cleanly on port 3099
- `GET /` returns HTTP 200
- Hebrew placeholder text renders correctly with RTL direction
- No compilation errors or warnings in the server output
- Heebo font loads from Google Fonts
- Tailwind v3 CSS variables (from `globals.css`) are applied (bg-background, text-foreground classes work)
