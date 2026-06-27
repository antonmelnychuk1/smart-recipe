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
    title: "Ryż smażony z jajkiem",
    description:
      "Szybki obiad z jednej patelni — idealny sposób na wykorzystanie ugotowanego ryżu.",
    time: 18,
    difficulty: "Bardzo łatwy",
    calories: 430,
    protein: 27,
    carbs: 54,
    fat: 12,
    match: 86,
    ingredients: ["ryż", "jajka", "kurczak"],
    missing: ["sos sojowy", "dymka"],
    steps: [
      "Podsmaż kurczaka na patelni.",
      "Dodaj ryż i smaż przez kilka minut.",
      "Wbij jajka, wymieszaj i dopraw sosem sojowym.",
    ],
    emoji: "🍳",
    imageQuery: "chicken egg fried rice",
  },
  {
    title: "Szakszuka ze szpinakiem",
    description:
      "Jajka duszone w aromatycznym sosie pomidorowym z porcją zielonych warzyw.",
    time: 24,
    difficulty: "Łatwy",
    calories: 370,
    protein: 21,
    carbs: 25,
    fat: 20,
    match: 78,
    ingredients: ["jajka", "pomidor", "szpinak"],
    missing: ["cebula", "kumin"],
    steps: [
      "Podsmaż cebulę z kuminem.",
      "Dodaj pomidory i szpinak, a następnie duś sos.",
      "Zrób wgłębienia, wbij jajka i gotuj pod przykryciem.",
    ],
    emoji: "🥘",
    imageQuery: "spinach shakshuka eggs",
  },
];
