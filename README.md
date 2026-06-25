# SmartRecipe

SmartRecipe is an AI-powered web application that generates recipes from
ingredients users already have at home. It helps simplify meal planning,
create shopping lists, and reduce food waste.

## Features

- generate three personalized recipes with the OpenAI API,
- filter recipes by diet and maximum preparation time,
- calculate how well each recipe matches the available ingredients,
- identify missing ingredients,
- provide step-by-step instructions and nutritional estimates,
- create and manage a shopping list,
- plan breakfast, lunch, and dinner for each day of the week,
- add missing ingredients from the weekly plan to the shopping list,
- save favorite recipes,
- access recent search history,
- register and sign in with email and password,
- access a protected administrator dashboard with user and usage statistics,
- synchronize user data with PostgreSQL,
- protect OpenAI usage with persistent daily generation limits,
- store data locally for guests,
- use a responsive Polish-language interface.

## Tech Stack

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS
- OpenAI Responses API and Structured Outputs
- PostgreSQL
- Prisma ORM
- Better Auth
- Zod

## Architecture

```text
User
  |
  v
Next.js interface
  |
  +-- /api/recipes --> OpenAI API
  |                     |
  |                     v
  |                validated recipe
  |
  +-- /api/auth ------> Better Auth
  |
  +-- /api/kitchen ---> Prisma ---> PostgreSQL
```

The OpenAI API key and database credentials are used exclusively on the
server. They are never included in the client-side bundle.

## Local Development

### 1. Requirements

- Node.js 20 or newer,
- a PostgreSQL database,
- an OpenAI API key.

### 2. Installation

```bash
git clone https://github.com/YOUR_USERNAME/smart-recipe.git
cd smart-recipe
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and provide the required values:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM="SmartRecipe <onboarding@resend.dev>"
```

Generate a Better Auth secret with:

```bash
openssl rand -base64 32
```

Never commit `.env.local`.

### 4. Database setup

```bash
npm run db:generate
npm run db:migrate
```

The migration creates tables for users, sessions, favorite recipes, search
history, and shopping-list items.

### 5. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev          # start the development server
npm run build        # create a production build
npm run start        # start the production build
npm run lint         # check code quality
npm run db:generate  # generate the Prisma client
npm run db:migrate   # create and apply a local migration
npm run db:studio    # open the database browser
npm run admin:promote -- user@example.com # grant administrator access
```

## Deployment

The project can be deployed to Vercel or any other hosting provider that
supports Next.js applications.

Configure the following environment variables in production:

```text
OPENAI_API_KEY
OPENAI_MODEL
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

`BETTER_AUTH_URL` must point to the public application URL, for example:

```env
BETTER_AUTH_URL=https://smart-recipe.vercel.app
```

Apply Prisma migrations whenever the production database schema changes.

`RESEND_API_KEY` enables verification emails. During development,
`onboarding@resend.dev` can send only to the email address associated with the
Resend account. For public delivery, verify your own domain in Resend and set
`EMAIL_FROM`, for example:

```env
EMAIL_FROM="SmartRecipe <hello@your-domain.com>"
```

## Administrator Access

The protected dashboard is available at `/admin`. Access is checked on the
server against the user's role stored in PostgreSQL.

Grant administrator access to an existing account with:

```bash
npm run admin:promote -- user@example.com
```

Run this command only from a trusted environment with access to
`DATABASE_URL`.

## Security

- secrets are stored exclusively in environment variables,
- AI responses are validated before they reach the interface,
- user data is protected by session-based authorization,
- passwords and sessions are handled by Better Auth,
- `.env.local` is excluded from Git.

## Roadmap

- email verification and password recovery,
- configurable usage plans and higher limits for selected users,
- ingredient scaling based on serving size,
- substitutions for missing ingredients,
- prioritization of ingredients nearing their expiration date,
- automated tests,
- iOS and Android applications built with React Native and Expo,
- App Store and Google Play releases.

## Project Status

SmartRecipe is under active development. The current version includes a
working AI recipe generator, authentication, and persistent user data.
