// src/data/local-food-data.ts

import type { Nutrition } from '@/services/nutrition';

export interface LocalFoodItem {
  /** The primary key for lookup, should be a normalized name. e.g., "idli" */
  key: string;
  /** User-friendly display name, can include brand or type. e.g., "Idli (Standard, 1 piece)" */
  displayName: string;
  /** Nutritional information for the defined serving size. */
  nutrition: Nutrition;
  /** Description of the serving size for which nutrition is provided. e.g., "1 piece (approx. 40g)" */
  servingSizeDescription: string;
  /** Optional brand or source information. */
  brand?: string;
}

// Data provided by the user
export const localFoodDatabase: LocalFoodItem[] = [
  {
    key: "idli",
    displayName: "Idli (Standard)",
    nutrition: { calories: 40, fat: 0.19, carbohydrates: 7.89, protein: 1.91 },
    servingSizeDescription: "per 1 piece",
  },
  {
    key: "rice idli (hommade)",
    displayName: "Rice Idli (Hommade)",
    nutrition: { calories: 62, fat: 0.00, carbohydrates: 15.00, protein: 1.00 },
    servingSizeDescription: "per 1 piece (50g)",
  },
  {
    key: "rava idli",
    displayName: "Rava Idli",
    nutrition: { calories: 74, fat: 1.28, carbohydrates: 13.20, protein: 2.41 },
    servingSizeDescription: "per 1 piece",
  },
  {
    key: "fried idli",
    displayName: "Fried Idli",
    nutrition: { calories: 53, fat: 1.65, carbohydrates: 7.67, protein: 1.91 },
    servingSizeDescription: "per 1 piece",
  },
  {
    key: "rice idli (mtr)",
    displayName: "Rice Idli (MTR)",
    brand: "MTR",
    nutrition: { calories: 340, fat: 2.30, carbohydrates: 67.00, protein: 13.00 },
    servingSizeDescription: "per 100g",
  },
  {
    key: "instant rava idli mix (bambino)",
    displayName: "Instant Rava Idli Mix (Bambino)",
    brand: "Bambino",
    nutrition: { calories: 402, fat: 7.70, carbohydrates: 77.00, protein: 12.00 },
    servingSizeDescription: "per 100g",
  },
  {
    key: "idly & dosa batter (id)", // Existing entry
    displayName: "Idly & Dosa Batter (ID)",
    brand: "ID",
    nutrition: { calories: 139, fat: 1.61, carbohydrates: 29.32, protein: 1.74 },
    servingSizeDescription: "per 100g",
  },
  {
    key: "imli sauce (veeba)",
    displayName: "Imli Sauce (Veeba)",
    brand: "Veeba",
    nutrition: { calories: 196, fat: 0.15, carbohydrates: 47.95, protein: 0.75 },
    servingSizeDescription: "per 100g",
  },
  {
    key: "idli (mccain)",
    displayName: "Idli (McCain)",
    brand: "McCain",
    nutrition: { calories: 500, fat: 8.00, carbohydrates: 85.00, protein: 18.00 },
    servingSizeDescription: "per 7 pieces (180g)",
  },
  // New entries from user request
  {
    key: "ragi dosa",
    displayName: "Ragi Dosa",
    nutrition: { calories: 137, fat: 3.22, carbohydrates: 23.94, protein: 3.95 },
    servingSizeDescription: "per 1 piece",
  },
  {
    key: "ragi roti",
    displayName: "Ragi Roti",
    nutrition: { calories: 118, fat: 2.33, carbohydrates: 21.02, protein: 3.23 },
    servingSizeDescription: "per 1 piece",
  },
  {
    key: "plain dosa",
    displayName: "Plain Dosa",
    nutrition: { calories: 106, fat: 1.04, carbohydrates: 21.24, protein: 2.51 },
    servingSizeDescription: "per 1 dosa",
  },
  {
    key: "dosa batter (id)", // Updated entry for Dosa Batter (ID)
    displayName: "Dosa Batter (ID)",
    brand: "ID",
    nutrition: { calories: 143, fat: 1.60, carbohydrates: 26.30, protein: 5.50 },
    servingSizeDescription: "per 100g",
  },
  // Add more items here in the future
  // Example:
  // {
  //   key: "sambar",
  //   displayName: "Sambar (Typical)",
  //   nutrition: { calories: 150, protein: 7, carbohydrates: 20, fat: 5 },
  //   servingSizeDescription: "per 1 cup (approx 240ml)",
  // },
];

/**
 * Looks up a food item in the local database.
 * Performs a case-insensitive match on the item's key.
 * @param foodName The name of the food item to look up.
 * @returns The LocalFoodItem if found, otherwise null.
 */
export function findInLocalDatabase(foodName: string): LocalFoodItem | null {
  if (!foodName || foodName.trim() === "") {
    return null;
  }
  const normalizedFoodName = foodName.toLowerCase().trim();
  const foundItem = localFoodDatabase.find(
    (item) => item.key === normalizedFoodName
  );
  return foundItem || null;
}
