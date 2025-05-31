
/**
 * Represents nutritional information for a food item.
 */
export interface Nutrition {
  /**
   * The number of calories in the food item.
   */
  calories: number;
  /**
   * The amount of protein in grams in the food item.
   */
  protein: number;
  /**
   * The amount of carbohydrates in grams in the food item.
   */
  carbohydrates: number;
  /**
   * The amount of fat in grams in the food item.
   */
  fat: number;
  // Fiber can be added here if needed in the future:
  // fiber?: number;
}

// The getNutrition dummy function is no longer needed as AI flows
// (or local data) will handle estimation directly.
// If other parts of the codebase were calling this, they'll need to be
// updated to call the appropriate AI flow like `estimateNutritionFromText`.
