import type { Recipe } from "@/lib/recipe-types";

export const sampleRecipes: Recipe[] = [
  {
    title: "Kremowe risotto z kurczakiem",
    description:
      "Proste, sycące risotto z delikatnym kurczakiem i świeżym szpinakiem.",
    time: 30,
    difficulty: "Łatwy",
    calories: 540,
    protein: 38,
    carbs: 62,
    fat: 16,
    match: 92,
    ingredients: ["ryż", "kurczak", "szpinak"],
    missing: ["bulion", "parmezan"],
    steps: [
      "Pokrój kurczaka i podsmaż go na rozgrzanej patelni.",
      "Dodaj ryż i stopniowo dolewaj gorący bulion.",
      "Pod koniec wmieszaj szpinak i parmezan.",
    ],
    emoji: "🍲",
    imageQuery: "creamy chicken spinach risotto",
  },
  {
    title: "Szybki bowl z ryżem, kurczakiem i jajkiem",
    description:
      "Prosty bowl z ciepłym ryżem, soczystym kurczakiem i jajkiem — szybki i sycący.",
    time: 17,
    difficulty: "Bardzo łatwy",
    calories: 450,
    protein: 30,
    carbs: 50,
    fat: 14,
    match: 87,
    ingredients: ["ryż", "jajka", "kurczak"],
    missing: ["sos sojowy", "warzywa"],
    steps: [
      "Podsmaż pokrojonego kurczaka na patelni.",
      "W międzyczasie podgrzej ugotowany ryż.",
      "Usmaż jajko sadzone lub na miękko.",
      "Podaj wszystko razem w misce i dopraw.",
    ],
    emoji: "🍚",
    imageQuery: "chicken rice egg bowl top view asian style plated food",
  },
  {
    title: "Omlet ryżowy z kurczakiem",
    description:
      "Szybki, sycący omlet z dodatkiem ryżu i kurczaka — coś pomiędzy śniadaniem a obiadem.",
    time: 16,
    difficulty: "Łatwy",
    calories: 460,
    protein: 33,
    carbs: 42,
    fat: 18,
    match: 89,
    ingredients: ["ryż", "jajka", "kurczak"],
    missing: ["ser", "przyprawy"],
    steps: [
      "Podsmaż pokrojonego kurczaka na patelni.",
      "Dodaj ugotowany ryż i wymieszaj.",
      "Roztrzep jajka i wlej na patelnię.",
      "Smaż jak omlet, aż się zetnie i lekko zarumieni.",
    ],
    emoji: "🍳",
    imageQuery: "chicken rice omelette golden brown on pan close up",
  }
];
