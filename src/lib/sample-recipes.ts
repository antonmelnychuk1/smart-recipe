import type { Recipe } from "@/lib/recipe-types";
import {
  convertPrice,
  type AppLanguage,
  type CurrencyCode,
  type PriceRegionCode,
} from "@/lib/i18n";

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

export const sampleRecipesByLanguage: Record<AppLanguage, Recipe[]> = {
  pl: sampleRecipes,
  en: [
    {
      title: "Creamy chicken risotto",
      description:
        "A simple, filling risotto with tender chicken and fresh spinach.",
      time: 30,
      difficulty: "Easy",
      calories: 540,
      protein: 38,
      carbs: 62,
      fat: 16,
      estimatedCost: 27,
      match: 92,
      ingredients: [
        "180 g arborio rice",
        "300 g chicken breast",
        "100 g fresh spinach",
        "700 ml water",
        "1 pc carrot",
        "1 pc onion",
        "1 celery stalk",
        "1 pc bay leaf",
        "50 g parmesan",
        "1 tablespoon olive oil",
        "0.5 teaspoon salt",
      ],
      missing: ["carrot", "onion", "celery", "parmesan"],
      substitutions: [
        {
          ingredient: "50 g parmesan",
          substitutes: ["50 g grana padano", "40 g mature hard cheese"],
        },
        {
          ingredient: "100 g fresh spinach",
          substitutes: ["80 g arugula", "120 g frozen spinach"],
        },
      ],
      steps: [
        "Prepare a simple stock: simmer 700 ml water with 1 pc carrot, 1 pc onion, 1 celery stalk, 1 pc bay leaf and 0.5 teaspoon salt for about 15 minutes.",
        "Slice 300 g chicken breast and fry it in 1 tablespoon olive oil.",
        "Add 180 g arborio rice and gradually pour in the prepared stock.",
        "Near the end, stir in 100 g fresh spinach and 50 g parmesan.",
      ],
      emoji: "🍲",
      imageQuery: "creamy chicken spinach risotto",
    },
    {
      title: "Quick rice bowl with chicken and egg",
      description:
        "A simple bowl with warm rice, juicy chicken and egg — quick and satisfying.",
      time: 17,
      difficulty: "Very easy",
      calories: 450,
      protein: 30,
      carbs: 50,
      fat: 14,
      estimatedCost: 22,
      match: 87,
      ingredients: [
        "200 g cooked rice",
        "300 g chicken breast",
        "2 pcs eggs",
        "150 g mixed vegetables",
        "2 tablespoons soy sauce",
        "1 tablespoon oil",
      ],
      missing: ["mixed vegetables", "soy sauce"],
      substitutions: [
        {
          ingredient: "2 tablespoons soy sauce",
          substitutes: ["2 tablespoons tamari", "1 tablespoon teriyaki sauce"],
        },
        {
          ingredient: "150 g mixed vegetables",
          substitutes: ["150 g broccoli", "150 g bell pepper and carrot"],
        },
      ],
      steps: [
        "Fry 300 g sliced chicken breast in 1 tablespoon oil.",
        "Meanwhile, warm 200 g cooked rice.",
        "Fry 2 pcs eggs sunny-side up or soft-set.",
        "Add 150 g mixed vegetables and 2 tablespoons soy sauce, then serve everything together in a bowl.",
      ],
      emoji: "🍚",
      imageQuery: "chicken rice egg bowl top view asian style plated food",
    },
    {
      title: "Chicken rice omelette",
      description:
        "A quick, filling omelette with rice and chicken — somewhere between breakfast and lunch.",
      time: 16,
      difficulty: "Easy",
      calories: 460,
      protein: 33,
      carbs: 42,
      fat: 18,
      estimatedCost: 18,
      match: 89,
      ingredients: [
        "150 g cooked rice",
        "4 pcs eggs",
        "200 g chicken breast",
        "50 g grated cheese",
        "1 tablespoon oil",
        "0.5 teaspoon salt",
        "0.25 teaspoon pepper",
      ],
      missing: ["grated cheese"],
      substitutions: [
        {
          ingredient: "50 g grated cheese",
          substitutes: ["50 g mozzarella", "40 g cheddar"],
        },
        {
          ingredient: "1 tablespoon oil",
          substitutes: ["1 tablespoon olive oil", "10 g butter"],
        },
      ],
      steps: [
        "Fry 200 g sliced chicken breast in 1 tablespoon oil.",
        "Add 150 g cooked rice and mix.",
        "Whisk 4 pcs eggs with 0.5 teaspoon salt and 0.25 teaspoon pepper, then pour into the pan.",
        "Sprinkle with 50 g grated cheese and cook like an omelette until set and lightly golden.",
      ],
      emoji: "🍳",
      imageQuery: "chicken rice omelette golden brown on pan close up",
    },
  ],
  uk: [
    {
      title: "Кремове ризото з куркою",
      description:
        "Просте й ситне ризото з ніжною куркою та свіжим шпинатом.",
      time: 30,
      difficulty: "Легко",
      calories: 540,
      protein: 38,
      carbs: 62,
      fat: 16,
      estimatedCost: 27,
      match: 92,
      ingredients: [
        "180 г рису арборіо",
        "300 г курячої грудки",
        "100 г свіжого шпинату",
        "700 мл води",
        "1 шт. моркви",
        "1 шт. цибулі",
        "1 стебло селери",
        "1 шт. лаврового листа",
        "50 г пармезану",
        "1 столова ложка оливкової олії",
        "0,5 чайної ложки солі",
      ],
      missing: ["морква", "цибуля", "селера", "пармезан"],
      substitutions: [
        {
          ingredient: "50 г пармезану",
          substitutes: ["50 г грана падано", "40 г твердого витриманого сиру"],
        },
        {
          ingredient: "100 г свіжого шпинату",
          substitutes: ["80 г руколи", "120 г замороженого шпинату"],
        },
      ],
      steps: [
        "Приготуй простий бульйон: вари 700 мл води з 1 шт. моркви, 1 шт. цибулі, 1 стеблом селери, 1 шт. лаврового листа та 0,5 чайної ложки солі приблизно 15 хвилин.",
        "Наріж 300 г курячої грудки та обсмаж у 1 столовій ложці оливкової олії.",
        "Додай 180 г рису арборіо та поступово підливай підготовлений бульйон.",
        "Наприкінці вмішай 100 г свіжого шпинату та 50 г пармезану.",
      ],
      emoji: "🍲",
      imageQuery: "creamy chicken spinach risotto",
    },
    {
      title: "Швидка рисова боул-страва з куркою та яйцем",
      description:
        "Проста миска з теплим рисом, соковитою куркою та яйцем — швидко й ситно.",
      time: 17,
      difficulty: "Дуже легко",
      calories: 450,
      protein: 30,
      carbs: 50,
      fat: 14,
      estimatedCost: 22,
      match: 87,
      ingredients: [
        "200 г вареного рису",
        "300 г курячої грудки",
        "2 шт. яєць",
        "150 г овочевої суміші",
        "2 столові ложки соєвого соусу",
        "1 столова ложка олії",
      ],
      missing: ["овочева суміш", "соєвий соус"],
      substitutions: [
        {
          ingredient: "2 столові ложки соєвого соусу",
          substitutes: ["2 столові ложки тамарі", "1 столова ложка соусу теріякі"],
        },
        {
          ingredient: "150 г овочевої суміші",
          substitutes: ["150 г броколі", "150 г перцю та моркви"],
        },
      ],
      steps: [
        "Обсмаж 300 г нарізаної курячої грудки в 1 столовій ложці олії.",
        "Паралельно підігрій 200 г вареного рису.",
        "Посмаж 2 шт. яєць як яєчню або до м’якого жовтка.",
        "Додай 150 г овочевої суміші та 2 столові ложки соєвого соусу, потім подай усе разом у мисці.",
      ],
      emoji: "🍚",
      imageQuery: "chicken rice egg bowl top view asian style plated food",
    },
    {
      title: "Омлет із куркою та рисом",
      description:
        "Швидкий ситний омлет із рисом і куркою — щось між сніданком та обідом.",
      time: 16,
      difficulty: "Легко",
      calories: 460,
      protein: 33,
      carbs: 42,
      fat: 18,
      estimatedCost: 18,
      match: 89,
      ingredients: [
        "150 г вареного рису",
        "4 шт. яєць",
        "200 г курячої грудки",
        "50 г тертого сиру",
        "1 столова ложка олії",
        "0,5 чайної ложки солі",
        "0,25 чайної ложки перцю",
      ],
      missing: ["тертий сир"],
      substitutions: [
        {
          ingredient: "50 г тертого сиру",
          substitutes: ["50 г моцарели", "40 г чедеру"],
        },
        {
          ingredient: "1 столова ложка олії",
          substitutes: ["1 столова ложка оливкової олії", "10 г вершкового масла"],
        },
      ],
      steps: [
        "Обсмаж 200 г нарізаної курячої грудки в 1 столовій ложці олії.",
        "Додай 150 г вареного рису та перемішай.",
        "Збий 4 шт. яєць із 0,5 чайної ложки солі та 0,25 чайної ложки перцю, потім вилий на сковороду.",
        "Посип 50 г тертого сиру та готуй як омлет, доки маса схопиться і злегка підрум’яниться.",
      ],
      emoji: "🍳",
      imageQuery: "chicken rice omelette golden brown on pan close up",
    },
  ],
};

export function getSampleRecipes(
  language: AppLanguage,
  currency: CurrencyCode = "PLN",
  priceRegion: PriceRegionCode = "PL",
) {
  return sampleRecipesByLanguage[language].map((recipe) => ({
    ...recipe,
    estimatedCost: recipe.estimatedCost
      ? convertPrice(recipe.estimatedCost, "PLN", currency)
      : undefined,
    currency,
    priceRegion,
  }));
}
