# SmartRecipe

Aplikacja webowa, która układa przepisy z produktów dostępnych w domu. Jej
główny cel to prostsze planowanie posiłków i ograniczenie marnowania jedzenia.

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

## Obecny stan

Pierwszy interaktywny prototyp zawiera:

- dodawanie i usuwanie składników,
- wybór diety oraz maksymalnego czasu,
- generowanie trzech przepisów przez OpenAI API,
- walidowany format odpowiedzi AI,
- informację o dopasowaniu i brakujących produktach,
- szczegóły przepisu, kroki oraz makroskładniki,
- zapisywanie pełnych ulubionych przepisów,
- historię 10 ostatnich wyszukiwań,
- wspólną listę brakujących produktów,
- responsywny interfejs w języku polskim.

Przed pierwszym uruchomieniem utwórz `.env.local`:

```env
OPENAI_API_KEY=sk-...
# Opcjonalnie:
OPENAI_MODEL=gpt-5.4-mini
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=wygenerowany-sekret-minimum-32-znaki
BETTER_AUTH_URL=http://localhost:3000
```

Klucz jest używany wyłącznie przez serwerowy endpoint `/api/recipes` i nie
trafia do kodu przeglądarki.

Bez logowania ulubione, historia i lista zakupów są zapisywane lokalnie w
przeglądarce. Po utworzeniu konta dane są przenoszone do PostgreSQL i przypisane
do użytkownika.

Sekret Better Auth wygenerujesz poleceniem:

```bash
openssl rand -base64 32
```

Skopiuj wynik do `BETTER_AUTH_SECRET` w `.env.local`.

## Proponowany zakres MVP

1. Weryfikacja adresu e-mail i reset hasła.
2. Testy endpointów i ograniczenie liczby zapytań.
3. Deployment na Vercel.

Planner tygodniowy, automatyczna lista zakupów i personalizacja na podstawie
historii powinny wejść dopiero po domknięciu tego przepływu.

## Docelowa architektura

```text
Interfejs Next.js
       |
Server Action / API Route
       |
walidacja danych -> OpenAI API
       |
PostgreSQL + Prisma
```

Klucz API nigdy nie powinien trafiać do kodu klienta. Wywołanie modelu wykonuje
serwer, a odpowiedź przed wyświetleniem jest walidowana.

## Pomysły na wyróżnienie projektu

- **Tryb „uratować najpierw”** — produkty otrzymują datę ważności, a generator
  priorytetyzuje te, które trzeba szybko zużyć.
- **Poziom elastyczności** — użytkownik wybiera: tylko posiadane produkty,
  maksymalnie 2 brakujące albo dowolne uzupełnienia.
- **Zamienniki** — przepis od razu proponuje zamianę brakującego składnika.
- **Porcje i skalowanie** — automatyczne przeliczenie ilości dla 1–8 osób.
- **Ocena realnego wykorzystania** — wskaźnik pokazujący, jak dużo zapasów
  zużywa konkretny przepis.
- **Budżet posiłku** — opcjonalny limit kosztu brakujących produktów.

## Skrypty

```bash
npm run dev
npm run lint
npm run build
npm run db:migrate
npm run db:studio
```
