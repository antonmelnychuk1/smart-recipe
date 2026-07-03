export type Recipe = {
  title: string;
  description: string;
  time: number;
  difficulty: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  match: number;
  ingredients: string[];
  missing: string[];
  steps: string[];
  emoji: string;
  savedId?: string;
  isPublic?: boolean;
  imageQuery?: string;
  image?: {
    url: string;
    alt: string;
    photographer: string;
    photographerUrl: string;
    sourceUrl: string;
  };
};

export type SearchHistoryEntry = {
  id: string;
  createdAt: string;
  ingredients: string[];
  diet: string;
  maxTime: number;
  recipes: Recipe[];
};

export type PantryItem = {
  id: string;
  label: string;
  quantity: string;
  expiresAt: string | null;
};

export type MealType = "breakfast" | "lunch" | "dinner";

export type MealPlanEntry = {
  id: string;
  day: number;
  mealType: MealType;
  recipe: Recipe;
};
