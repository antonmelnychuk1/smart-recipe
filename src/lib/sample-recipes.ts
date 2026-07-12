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
    estimatedCost: 27,
    match: 92,
    ingredients: [
      "180 g ryżu arborio",
      "300 g filetu z kurczaka",
      "100 g świeżego szpinaku",
      "700 ml bulionu",
      "50 g parmezanu",
      "1 łyżka oliwy",
      "0,5 łyżeczki soli",
    ],
    missing: ["700 ml bulionu", "50 g parmezanu"],
    substitutions: [
      {
        ingredient: "50 g parmezanu",
        substitutes: ["50 g grana padano", "40 g sera bursztyn"],
      },
      {
        ingredient: "100 g świeżego szpinaku",
        substitutes: ["80 g rukoli", "120 g mrożonego szpinaku"],
      },
    ],
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
    estimatedCost: 22,
    match: 87,
    ingredients: [
      "200 g ugotowanego ryżu",
      "300 g filetu z kurczaka",
      "2 szt. jajek",
      "150 g mieszanki warzyw",
      "2 łyżki sosu sojowego",
      "1 łyżka oleju",
    ],
    missing: ["150 g mieszanki warzyw", "2 łyżki sosu sojowego"],
    substitutions: [
      {
        ingredient: "2 łyżki sosu sojowego",
        substitutes: ["2 łyżki tamari", "1 łyżka sosu teriyaki"],
      },
      {
        ingredient: "150 g mieszanki warzyw",
        substitutes: ["150 g brokułu", "150 g papryki i marchewki"],
      },
    ],
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
    estimatedCost: 18,
    match: 89,
    ingredients: [
      "150 g ugotowanego ryżu",
      "4 szt. jajek",
      "200 g filetu z kurczaka",
      "50 g tartego sera",
      "1 łyżka oleju",
      "0,5 łyżeczki soli",
      "0,25 łyżeczki pieprzu",
    ],
    missing: ["50 g tartego sera", "0,25 łyżeczki pieprzu"],
    substitutions: [
      {
        ingredient: "50 g tartego sera",
        substitutes: ["50 g mozzarelli", "40 g sera cheddar"],
      },
      {
        ingredient: "1 łyżka oleju",
        substitutes: ["1 łyżka oliwy", "10 g masła"],
      },
    ],
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
