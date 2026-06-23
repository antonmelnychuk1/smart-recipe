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
};

export type SearchHistoryEntry = {
  id: string;
  createdAt: string;
  ingredients: string[];
  diet: string;
  maxTime: number;
  recipes: Recipe[];
};
