# Release Checklist

Use this checklist before deploying SmartRecipe to production or preparing a mobile build.

## 1. Code quality

- [ ] Review recent changes locally.
- [ ] Make sure no secrets are committed.
- [ ] Run local iOS release audit:

  ```bash
  npm run ios:audit
  ```

- [ ] Run lint:

  ```bash
  npm run lint
  ```

- [ ] Run production build:

  ```bash
  npm run build
  ```

- [ ] Check whitespace/errors in git diff:

  ```bash
  git diff --check
  ```

## 2. Environment variables

Confirm production hosting has all required variables:

- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_MODEL`
- [ ] `DATABASE_URL`
- [ ] `BETTER_AUTH_SECRET`
- [ ] `BETTER_AUTH_URL`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED`
- [ ] `PEXELS_API_KEY`

Important:

- [ ] `BETTER_AUTH_URL` points to the production domain.
- [ ] `EMAIL_FROM` uses the verified sending domain.
- [ ] `NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED` is set intentionally.
- [ ] OpenAI usage limit/billing cap is still safe.

## 3. Database

- [ ] Review Prisma schema changes.
- [ ] Create migration if schema changed:

  ```bash
  npx prisma migrate dev
  ```

- [ ] Validate Prisma schema:

  ```bash
  npx prisma validate
  ```

- [ ] Confirm production database connection is healthy.
- [ ] Confirm admin account still exists.
- [ ] Confirm user limits/admin limits work as expected.

## 4. Production web smoke test

After deployment, test on `https://smartrecipeapp.com`:

- [ ] Home page loads.
- [ ] Language switch works: PL / EN / UK.
- [ ] Currency and price region switch works.
- [ ] Sign up works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Email verification works, if enabled.
- [ ] Password reset works.
- [ ] Password change works.
- [ ] Account deletion works on a test account.
- [ ] Recipe generation from ingredients works.
- [ ] Recipe generation from dish name works.
- [ ] Daily generation limits work.
- [ ] Admin account has no daily generation limit.
- [ ] Pexels photos load.
- [ ] Missing ingredients can be added to shopping list.
- [ ] Saved recipes work.
- [ ] Recipe history works.
- [ ] Meal planner works.
- [ ] Pantry/kitchen works.
- [ ] Support page works: `/support`.
- [ ] Privacy page works: `/privacy`.
- [ ] Terms page works: `/terms`.
- [ ] About page works: `/about`.

## 5. iOS wrapper

Before testing in Xcode:

- [ ] Push changes and wait for production deployment.
- [ ] Confirm Capacitor server URL is production:

  ```ts
  server: {
    url: "https://smartrecipeapp.com"
  }
  ```

- [ ] Sync Capacitor if native config/plugins/assets changed:

  ```bash
  npx cap sync
  ```

- [ ] Open Xcode.
- [ ] Run `Product > Clean Build Folder`.
- [ ] Delete old app from Simulator.
- [ ] Run app again.

Test in iOS Simulator:

- [ ] App icon is correct.
- [ ] Splash screen is correct.
- [ ] No React hydration/startup error in Xcode logs.
- [ ] Status bar looks correct.
- [ ] Bottom tab bar does not cover content.
- [ ] Modals respect safe areas.
- [ ] Login/register works.
- [ ] Recipe generation works.
- [ ] Saved recipes/history pages open.
- [ ] Meal planner tab works.
- [ ] Kitchen tab works.
- [ ] More tab opens settings/support/about/privacy/terms.

## 6. iOS versioning

Before uploading a new iOS build:

- [ ] Prepare the iOS release locally:

  ```bash
  npm run ios:prepare-release -- 1.0.1
  ```

- [ ] Increase build number: `CURRENT_PROJECT_VERSION`.
- [ ] Increase app version only for user-visible releases: `MARKETING_VERSION`.
- [ ] Confirm Bundle ID: `com.smartrecipeapp.app`.
- [ ] Confirm app is iPhone-only unless iPad support is intentionally added.
- [ ] Confirm orientation is portrait.
- [ ] Confirm no unused permissions are present.

## 7. App Store Connect

- [ ] Update listing from `APP_STORE.md`.
- [ ] Copy review notes from `APP_REVIEW_NOTES.md`.
- [ ] Prepare screenshots using `SCREENSHOTS.md`.
- [ ] Confirm support URL.
- [ ] Confirm privacy policy URL.
- [ ] Confirm app category.
- [ ] Create App Review test account.
- [ ] Add temporary test password only in App Store Connect notes.
- [ ] Do not commit reviewer password to git.
- [ ] Upload screenshots.
- [ ] Fill privacy nutrition labels.
- [ ] Fill export compliance.

## 8. Rollback plan

If production breaks:

- [ ] Revert to previous Vercel deployment.
- [ ] Disable risky feature flags/env changes if possible.
- [ ] Rotate exposed secrets if needed.
- [ ] Check Vercel logs.
- [ ] Check database migration state.
- [ ] Check OpenAI/Resend/Pexels provider status.

## 9. Git

Recommended flow:

```bash
git status
git add .
git commit -m "Release version x.y.z"
git push
```

After push:

- [ ] Confirm GitHub has the commit.
- [ ] Confirm Vercel deployment succeeded.
- [ ] Confirm production smoke test passed.
