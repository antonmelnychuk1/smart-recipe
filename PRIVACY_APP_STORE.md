# App Store Privacy Draft

This document is a working draft for App Store Connect privacy questions. Review it before submission and update it if SmartRecipe starts collecting new data or adds new permissions.

## Current privacy assumption

SmartRecipe does not request device permissions in the current version:

- no camera
- no microphone
- no location
- no contacts
- no photo library
- no health data

SmartRecipe uses account data and app-generated/user-entered content to provide recipe generation, saved recipes, shopping lists, pantry tracking and meal planning.

## Tracking

Recommended answer:

- Does this app use data to track users across apps and websites owned by other companies? **No**

Current app behavior:

- No third-party advertising SDK.
- No cross-app tracking.
- No IDFA usage.

If analytics, ads or attribution SDKs are added later, review this section again.

## Data linked to the user

These data types may be linked to a user account.

### Contact Info

Recommended App Store category:

- Contact Info → Email Address
- Contact Info → Name

Used for:

- app account
- login
- password reset
- email verification
- support/debugging account issues

Linked to user:

- Yes

Used for tracking:

- No

### User Content

Recommended App Store category:

- User Content → Other User Content

Examples:

- ingredients entered by user
- generated recipes saved by user
- shopping list items
- pantry products
- meal plans
- cooking preferences
- allergies and disliked ingredients

Used for:

- generating recipes
- saving recipes
- syncing account features
- building shopping lists
- pantry tracking
- meal planning
- improving the user experience inside the app

Linked to user:

- Yes, for logged-in users
- Guest data may be stored locally in the browser/device

Used for tracking:

- No

### Usage Data

Recommended App Store category:

- Usage Data → Product Interaction

Examples:

- recipe generation history
- saved recipe actions
- recipe feedback
- daily generation usage/limits
- admin-visible usage counters

Used for:

- showing history
- enforcing daily generation limits
- admin account management
- improving app features

Linked to user:

- Yes, for logged-in users

Used for tracking:

- No

### Identifiers

Recommended App Store category:

- Identifiers → User ID

Examples:

- internal database user ID
- session/account IDs

Used for:

- authentication
- account sessions
- associating saved recipes, shopping lists, pantry data and meal plans with the correct user

Linked to user:

- Yes

Used for tracking:

- No

## Data not collected

Recommended answer: not collected, unless the app changes later.

- Location
- Contacts
- Photos or Videos
- Audio Data
- Gameplay Content
- Browsing History
- Search History outside SmartRecipe
- Health and Fitness
- Financial Info
- Sensitive Info

Note: SmartRecipe has recipe generation history inside the app. If Apple asks about "Search History", do not mark external browsing/search history. The app stores internal recipe searches/generation history as app usage/user content.

## Diagnostics

Current recommendation:

- Diagnostics: **Not collected by the app directly**

However:

- Vercel, browser/runtime infrastructure, Apple/Xcode/TestFlight or hosting logs may record technical request information.
- If dedicated analytics/crash reporting is added later, update this section.

If later using Sentry, PostHog, Firebase, App Store Connect analytics or similar tools, revisit:

- Diagnostics → Crash Data
- Diagnostics → Performance Data
- Usage Data → Product Interaction

## Third-party services

SmartRecipe currently integrates with:

### OpenAI

Used for:

- AI recipe generation

Data sent may include:

- ingredients
- desired dish name
- diet
- budget/time preferences
- calorie/protein targets
- allergies and disliked ingredients

Tracking:

- No, based on current app use

### Pexels

Used for:

- recipe photos

Data sent may include:

- recipe/photo search query

Tracking:

- No, based on current app use

### Resend

Used for:

- account verification emails
- password reset emails

Data sent may include:

- email address
- email template content

Tracking:

- No, based on current app use

### Database / hosting

Used for:

- account data
- saved recipes
- history
- shopping list
- pantry
- meal plan
- admin features

Tracking:

- No

## App Store Connect answer summary

Suggested answers for current version:

- Data collected: **Yes**
- Data used to track users: **No**
- Data linked to the user: **Yes**

Likely selected categories:

- Contact Info
  - Name
  - Email Address
- User Content
  - Other User Content
- Identifiers
  - User ID
- Usage Data
  - Product Interaction

Suggested purpose mapping:

- Name
  - App Functionality
- Email Address
  - App Functionality
- Other User Content
  - App Functionality
- User ID
  - App Functionality
- Product Interaction
  - App Functionality

For each selected data type:

- Linked to user: **Yes**
- Used for tracking: **No**

Likely not selected:

- Location
- Contacts
- Photos or Videos
- Audio Data
- Health and Fitness
- Financial Info
- Sensitive Info
- Diagnostics, unless dedicated crash/analytics tooling is added

## Privacy policy alignment checklist

Before App Store submission:

- [ ] Confirm `/privacy` mentions account data.
- [ ] Confirm `/privacy` mentions saved recipes/history/shopping list/pantry/meal planner.
- [ ] Confirm `/privacy` mentions cooking preferences, allergies and disliked ingredients.
- [ ] Confirm `/privacy` mentions OpenAI.
- [ ] Confirm `/privacy` mentions Pexels.
- [ ] Confirm `/privacy` mentions Resend.
- [ ] Confirm `/support` works.
- [ ] Confirm account deletion is available in settings.
- [ ] Confirm no unused iOS permission descriptions are present in `Info.plist`.

## When to update this document

Update this file if SmartRecipe adds:

- analytics
- crash reporting
- ads
- push notifications
- camera scanning
- barcode scanning
- photo uploads
- location-based features
- social login
- payments/subscriptions
- personalized marketing
- third-party tracking
