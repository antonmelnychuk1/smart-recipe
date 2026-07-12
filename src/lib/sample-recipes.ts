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
      "700 ml wody",
      "1 szt. marchewki",
      "1 szt. cebuli",
      "1 łodyga selera naciowego",
      "1 szt. liścia laurowego",
      "50 g parmezanu",
      "1 łyżka stołowa oliwy",
      "0,5 łyżeczki soli",
    ],
    missing: ["marchewka", "cebula", "seler naciowy", "parmezan"],
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
      "Przygotuj prosty bulion: gotuj 700 ml wody z 1 szt. marchewki, 1 szt. cebuli, 1 łodygą selera naciowego, 1 szt. liścia laurowego i 0,5 łyżeczki soli przez około 15 minut.",
      "Pokrój 300 g filetu z kurczaka i podsmaż go na 1 łyżce stołowej oliwy.",
      "Dodaj 180 g ryżu arborio i stopniowo dolewaj przygotowany bulion.",
      "Pod koniec wmieszaj 100 g świeżego szpinaku i 50 g parmezanu.",
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
      "2 łyżki stołowe sosu sojowego",
      "1 łyżka stołowa oleju",
    ],
    missing: ["mieszanka warzyw", "sos sojowy"],
    substitutions: [
      {
        ingredient: "2 łyżki stołowe sosu sojowego",
        substitutes: ["2 łyżki stołowe tamari", "1 łyżka stołowa sosu teriyaki"],
      },
      {
        ingredient: "150 g mieszanki warzyw",
        substitutes: ["150 g brokułu", "150 g papryki i marchewki"],
      },
    ],
    steps: [
      "Podsmaż 300 g pokrojonego kurczaka na 1 łyżce stołowej oleju.",
      "W międzyczasie podgrzej 200 g ugotowanego ryżu.",
      "Usmaż 2 szt. jajek sadzonych lub na miękko.",
      "Dodaj 150 g mieszanki warzyw i 2 łyżki stołowe sosu sojowego, a potem podaj wszystko razem w misce.",
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
      "1 łyżka stołowa oleju",
      "0,5 łyżeczki soli",
      "0,25 łyżeczki pieprzu",
    ],
    missing: ["tarty ser"],
    substitutions: [
      {
        ingredient: "50 g tartego sera",
        substitutes: ["50 g mozzarelli", "40 g sera cheddar"],
      },
      {
        ingredient: "1 łyżka stołowa oleju",
        substitutes: ["1 łyżka stołowa oliwy", "10 g masła"],
      },
    ],
    steps: [
      "Podsmaż 200 g pokrojonego filetu z kurczaka na 1 łyżce stołowej oleju.",
      "Dodaj 150 g ugotowanego ryżu i wymieszaj.",
      "Roztrzep 4 szt. jajek z 0,5 łyżeczki soli i 0,25 łyżeczki pieprzu, a potem wlej na patelnię.",
      "Posyp 50 g tartego sera i smaż jak omlet, aż się zetnie i lekko zarumieni.",
    ],
    emoji: "🍳",
    imageQuery: "chicken rice omelette golden brown on pan close up",
  }
];
