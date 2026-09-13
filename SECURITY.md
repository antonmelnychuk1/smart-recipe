# Security Policy

SmartRecipe handles user accounts, recipe history, saved recipes, shopping lists, pantry data and AI API integrations. Please report security issues responsibly.

## Supported versions

The latest production version of SmartRecipe is supported.

Older development builds, local forks and preview deployments may not receive security fixes.

## Reporting a vulnerability

If you believe you found a security issue, please do not open a public GitHub issue.

Contact:

- Email: `support@smartrecipeapp.com`

Please include:

- a short description of the issue
- affected page, endpoint or feature
- steps to reproduce
- potential impact
- screenshots or logs if useful

Do not include real user passwords, API keys, session tokens or private data in screenshots or logs.

## Secret leaks

If you find an exposed secret such as an API key, database URL, auth secret or email provider token:

1. Treat it as compromised.
2. Revoke or rotate the secret in the provider dashboard.
3. Remove the secret from the repository.
4. Update production environment variables.
5. Redeploy the application.
6. Review logs for suspicious usage.

Secrets should only be stored in local `.env.local` files or hosting provider environment variables. They should never be committed to the repository.

## Responsible disclosure

Please give us reasonable time to investigate and fix the issue before sharing details publicly.

We aim to acknowledge valid reports within 7 days and provide updates when a fix is available.

## Scope

In scope:

- account authentication and sessions
- password reset and email verification
- admin-only features
- user data access controls
- API endpoints
- environment variable or secret exposure

Out of scope:

- spam or social engineering
- issues requiring physical access to a user device
- denial-of-service testing without permission
- automated high-volume scanning
- reports about old dependencies without a practical exploit path
