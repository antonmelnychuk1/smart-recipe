# SmartRecipe Test Plan

Use this document to test SmartRecipe manually before major releases, production deploys and mobile builds.

## Test environments

Test at least:

- Local development: `npm run dev`
- Production web: `https://smartrecipeapp.com`
- iOS Simulator through Xcode

Recommended devices:

- iPhone 16 / latest simulator
- Smaller iPhone simulator if available
- Desktop browser

## 1. Guest user flow

1. Open the home page while logged out.
2. Confirm the page loads without console errors.
3. Confirm the default language/region/currency looks correct.
4. Add ingredients manually.
5. Generate recipes from ingredients.
6. Confirm guest generation limit is displayed.
7. Confirm generated recipe cards render correctly.
8. Open recipe details.
9. Add one missing ingredient to shopping list.
10. Add all missing ingredients to shopping list.
11. Confirm shopping list updates visually.
12. Try saving a recipe.
13. Confirm login/register prompt appears if required.

Expected result:

- Guest can preview and generate within guest limits.
- Account-only actions ask for authentication.

## 2. Registration and login

1. Open authentication modal.
2. Create a new test account.
3. Confirm successful login after registration.
4. Log out.
5. Log in again with the same account.
6. Confirm user panel appears.
7. Confirm account name/email are visible.

Expected result:

- User can register, log out and log in again.
- Session persists after page refresh.

## 3. Email verification

Only run this if email verification is enabled.

1. Register a new account.
2. Confirm verification notice appears.
3. Click send verification email.
4. Open email inbox.
5. Click verification link.
6. Return to the app.
7. Refresh account/admin view.

Expected result:

- Email becomes verified.
- Verification notice disappears.

## 4. Password reset

1. Log out.
2. Open password reset flow.
3. Enter test account email.
4. Confirm reset email arrives.
5. Open reset link.
6. Set a new password.
7. Log in with the new password.
8. Confirm old password no longer works.

Expected result:

- Password reset completes without JavaScript errors.
- User can log in with the new password.

## 5. Cooking preferences onboarding

1. Use an account with `preferencesCompleted = false`.
2. Open the home page.
3. Confirm the preferences prompt appears smoothly.
4. Click the prompt CTA.
5. Confirm the in-app preferences modal opens.
6. Fill diet, goal, budget, max time, calories, protein, allergies and disliked ingredients.
7. Save preferences.
8. Confirm modal closes.
9. Confirm prompt collapses smoothly.
10. Confirm both generators use the saved defaults.
11. Refresh the page.
12. Confirm preferences persist.

Expected result:

- Preferences are saved.
- Default generator settings update immediately.
- Prompt does not jump or overlap native tab bar.

## 6. Generate recipes from ingredients

1. Add at least three ingredients.
2. Choose diet.
3. Choose budget.
4. Choose max time.
5. Generate recipes.
6. Confirm three recipes appear.
7. Confirm recipe titles match selected language.
8. Confirm ingredients include quantities and units.
9. Confirm steps include useful quantities where needed.
10. Confirm missing ingredients do not include quantities in shopping chips.
11. Confirm duplicates are not shown as different word forms when possible.

Expected result:

- Generated recipes match inputs and language.
- Missing ingredient chips are clean shopping names.

## 7. Generate recipes from dish name

1. Go to "Type what you want to cook" section.
2. Enter a dish name, e.g. "pancakes".
3. Select independent diet, budget and time values.
4. Generate recipes.
5. Confirm three recipes appear.
6. Confirm layout does not show empty columns.
7. Open each recipe.

Expected result:

- Dish-name generator works independently from ingredient generator.
- Results are presented compactly on mobile.

## 8. Recipe details

1. Open a recipe.
2. Confirm photo loads or emoji fallback appears.
3. Confirm ingredients have quantities.
4. Change servings.
5. Confirm ingredient quantities update.
6. Confirm cooking mode step quantities update.
7. Confirm substitutions are readable.
8. Confirm missing ingredients can be added individually.
9. Confirm "add all missing" gives visible feedback.
10. Close modal.

Expected result:

- Recipe modal respects safe areas.
- Servings scaling works consistently.

## 9. Cooking mode

1. Open a recipe.
2. Start cooking mode.
3. Confirm ingredients checklist works.
4. Confirm step navigation works.
5. Confirm timer buttons work.
6. Mark steps as done.
7. Finish cooking mode.
8. Confirm option to mark pantry items as used.
9. Close cooking mode while timer is running.

Expected result:

- Cooking mode is usable on mobile.
- Sticky controls do not overlap safe areas.

## 10. Saved recipes and history

1. Save a generated recipe.
2. Open `/recipes`.
3. Confirm saved recipe appears.
4. Open recipe detail page `/recipes/[id]`.
5. Confirm back button works.
6. Open `/recipes/history`.
7. Restore a previous search.
8. Confirm restored recipes appear.

Expected result:

- Saved recipes and history persist for logged-in users.

## 11. Shopping list

1. Add missing ingredients to shopping list.
2. Add a custom item manually.
3. Mark item as bought.
4. Edit item.
5. Move bought items to pantry.
6. Remove bought items.

Expected result:

- Shopping list state persists and syncs.
- Mobile layout stays inside the viewport.

## 12. Pantry / kitchen

1. Add pantry item with quantity.
2. Add expiry date.
3. Edit pantry item.
4. Add pantry item to generator.
5. Mark pantry item as used.
6. Confirm expiring/expired notice appears when relevant.

Expected result:

- Pantry helps drive recipe generation.
- Expiry warnings are clear.

## 13. Meal planner

1. Open meal planner.
2. Add recipe to a day and meal slot.
3. Move/replace a planned meal.
4. Remove a planned meal.
5. Generate shopping list from plan if available.
6. Test mobile layout.

Expected result:

- Planner is compact and usable on mobile.
- Planned meals persist.

## 14. Admin panel

Use an admin account.

1. Open `/admin`.
2. Confirm user list loads.
3. Confirm admin has no daily generation limit.
4. Change user daily limit.
5. Ban/unban a test user if available.
6. Delete a test user.
7. Confirm table/card layout is usable on mobile.

Expected result:

- Admin-only actions are protected and functional.
- Non-admin users cannot access admin features.

## 15. Multi-language testing

Test PL, EN and UK.

1. Switch language.
2. Refresh page.
3. Confirm selected language persists.
4. Generate recipes.
5. Confirm generated titles, ingredients, steps and difficulty labels match selected language.
6. Check navigation, modals, support/about/privacy/terms pages.

Expected result:

- UI and generated recipe content match selected language.

## 16. Limits and billing safety

1. Test guest limit.
2. Test regular user daily limit.
3. Test admin unlimited generation.
4. Confirm limit messages are clear.
5. Confirm failed OpenAI requests show safe user-friendly errors.

Expected result:

- Limits protect API costs.
- Errors do not expose internal details.

## 17. iOS wrapper

1. Push and deploy latest production web version.
2. Run `npx cap sync` if native assets/config changed.
3. Open Xcode.
4. Clean build folder.
5. Delete old app from Simulator.
6. Run app.
7. Confirm app icon.
8. Confirm splash screen.
9. Confirm no startup React hydration errors.
10. Test all native tabs:
    - Cook
    - Recipes
    - Plan
    - Kitchen
    - More
11. Confirm support/about/privacy/terms links open.
12. Confirm modals do not overlap the bottom tab bar.

Expected result:

- iOS wrapper feels like an app, not a broken web page.

## 18. Regression notes

When a bug is found:

1. Record environment.
2. Record user state: guest/user/admin.
3. Record language/currency/region.
4. Record exact steps.
5. Add screenshot or log if useful.
6. Fix.
7. Re-run the related section of this plan.
