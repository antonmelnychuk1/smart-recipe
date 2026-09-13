# SmartRecipe App Store Draft

This file is a working draft for App Store Connect. Use it as a copy/paste base when preparing the first iOS release.

## App identity

- App name: SmartRecipe
- Bundle ID: `com.smartrecipeapp.app`
- Version: `1.0`
- Build: `1`
- Primary language: English
- Category: Food & Drink
- Secondary category: Health & Fitness or Lifestyle
- Age rating: 4+

## URLs

- Website / Marketing URL: `https://smartrecipeapp.com`
- Support URL: `https://smartrecipeapp.com/support`
- Privacy Policy URL: `https://smartrecipeapp.com/privacy`
- Terms of Use URL: `https://smartrecipeapp.com/terms`

## Subtitle

AI recipes from your pantry

## Promotional text

Turn the ingredients you already have into recipe ideas, shopping lists and weekly meal plans with SmartRecipe.

## Short description

SmartRecipe helps you cook with ingredients you already have at home. Add products from your pantry, choose your diet, time and budget, and get AI-generated recipes with steps, nutrition estimates and missing ingredients.

## Full description

SmartRecipe is an AI-powered cooking assistant that helps you plan meals, reduce food waste and make better use of the ingredients you already have.

Add products from your kitchen — such as eggs, rice, chicken, vegetables or pasta — and SmartRecipe suggests practical recipe ideas. You can also type what you want to cook, choose your diet, set a maximum preparation time and define a budget for two servings.

Each recipe can include:

- ingredients with quantities
- step-by-step cooking instructions
- estimated preparation time
- difficulty level
- calories and macronutrients
- missing ingredients
- substitutions
- real dish photos when available

SmartRecipe also helps with everyday planning:

- save favorite recipes
- review recipe history
- build a shopping list
- manage pantry products
- track products close to expiry
- plan meals for the week
- set cooking preferences such as diet, budget, allergies and disliked ingredients

SmartRecipe is designed for quick everyday cooking, not complicated meal planning. It is especially useful when you want to use what you already have and avoid buying unnecessary products.

Please note: recipes, nutrition values and costs are generated or estimated automatically and may require your review. Always check allergens, ingredient freshness and safe food preparation practices.

## Keywords

recipe,recipes,AI recipe,meal planner,shopping list,pantry,cooking,food waste,healthy meals,dinner ideas

## App Review notes

SmartRecipe is a web-based iOS wrapper built with Capacitor. The app loads `https://smartrecipeapp.com` and provides AI recipe generation, saved recipes, shopping lists, pantry tracking and meal planning.

If a reviewer needs to test account features, create a test account using email and password on the sign-up screen.

Suggested demo test account:

- Email: `reviewer@smartrecipeapp.com`
- Password: `ChangeBeforeSubmission123!`

Before submission, create this account manually and verify that it can:

- log in
- generate recipes
- save recipes
- add shopping list items
- use the meal planner
- open account settings

## Privacy summary draft

SmartRecipe may collect account information such as name and email address. The app stores user-created data such as saved recipes, shopping list items, pantry products, meal plans, search history and cooking preferences.

The app uses OpenAI to generate recipes from user-provided ingredients and preferences. The app may use Pexels to display recipe photos and Resend to send account-related emails.

The app does not request camera, microphone, location, contacts or photo library permissions in the current version.

## Screenshot checklist

Prepare screenshots for iPhone sizes required in App Store Connect. Recommended screens:

1. Home / recipe generator
2. Generated recipe results
3. Recipe details
4. Cooking mode
5. Meal planner
6. Pantry / kitchen
7. Shopping list
8. Account preferences

Suggested captions:

- Cook with what you already have
- Get AI recipe ideas in seconds
- See ingredients, steps and nutrition
- Follow recipes in cooking mode
- Plan your meals for the week
- Keep your pantry organized

## Pre-submission checklist

- [ ] Confirm production domain works: `https://smartrecipeapp.com`
- [ ] Confirm `/support`, `/privacy`, `/terms` and `/about` work
- [ ] Create and test App Review demo account
- [ ] Verify password reset email works in production
- [ ] Verify email verification works in production
- [ ] Test app on iPhone simulator after deleting old app build
- [ ] Test login, logout and account deletion
- [ ] Test recipe generation limits
- [ ] Test generated recipe language on PL/EN/UK
- [ ] Test saved recipes, history, meal plan, pantry and shopping list
- [ ] Confirm no unused iOS permissions are present
- [ ] Increase build number before every upload

## Future localization ideas

For the first release, English can be the primary App Store listing language. Later listings can be localized into:

- Polish
- Ukrainian
- Spanish
- German
- French
