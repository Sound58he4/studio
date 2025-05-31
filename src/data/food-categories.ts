// src/data/food-categories.ts

/**
 * Food categorization system for the points penalty system.
 * Categorizes foods as healthy, neutral, or unhealthy based on nutritional content and processing level.
 */

// Common unhealthy food patterns and keywords
export const UNHEALTHY_FOOD_KEYWORDS = [
  // Fast food
  'burger', 'pizza', 'fries', 'french fries', 'hot dog', 'fried chicken', 'nuggets',
  
  // Processed snacks
  'chips', 'crisps', 'popcorn', 'crackers', 'cookies', 'biscuits', 'wafers',
  
  // Sweets and desserts
  'cake', 'pastry', 'donut', 'doughnut', 'ice cream', 'candy', 'chocolate bar', 
  'brownie', 'muffin', 'cupcake', 'pie', 'tart', 'pudding',
  
  // Sugary drinks
  'soda', 'cola', 'soft drink', 'energy drink', 'sports drink', 'milkshake',
  'frappuccino', 'bubble tea', 'sweet tea',
  
  // Fried foods
  'fried', 'deep fried', 'tempura', 'pakora', 'samosa', 'spring roll',
  
  // Processed meats
  'bacon', 'sausage', 'hot dog', 'salami', 'pepperoni', 'ham sandwich',
  
  // High-sugar foods
  'jam', 'jelly', 'syrup', 'honey cake', 'sweet bread', 'danish',
  
  // Indian unhealthy foods
  'vada', 'bajji', 'bonda', 'pakoda', 'mixture', 'halwa', 'gulab jamun',
  'jalebi', 'laddu', 'barfi', 'rasgulla', 'kulfi', 'pani puri', 'chaat',
  'bhel puri', 'sev puri', 'dahi puri', 'aloo tikki',
  
  // Processed and packaged foods
  'instant noodles', 'maggi', 'ramen', 'cup noodles', 'ready meal', 'frozen meal',
  'packaged snack', 'processed cheese', 'cheese spread'
];

// Healthy food patterns (for reference, though not used in penalty calculation)
export const HEALTHY_FOOD_KEYWORDS = [
  // Vegetables
  'salad', 'vegetable', 'broccoli', 'spinach', 'kale', 'carrot', 'tomato',
  
  // Fruits
  'apple', 'banana', 'orange', 'berries', 'grapes', 'mango', 'papaya',
  
  // Lean proteins
  'grilled chicken', 'fish', 'salmon', 'tuna', 'tofu', 'lentils', 'beans',
  
  // Whole grains
  'quinoa', 'brown rice', 'oats', 'whole wheat', 'multigrain',
  
  // Healthy Indian foods
  'idli', 'dosa', 'sambhar', 'rasam', 'upma', 'poha', 'dhokla',
  'steamed', 'boiled', 'roti', 'chapati'
];

/**
 * Determines if a food item is unhealthy based on its name and description
 * @param foodName The name of the food item
 * @returns boolean indicating if the food is unhealthy
 */
export function isUnhealthyFood(foodName: string): boolean {
  if (!foodName || typeof foodName !== 'string') {
    return false;
  }
  
  const normalizedName = foodName.toLowerCase().trim();
  
  // Check if any unhealthy keyword is present in the food name
  return UNHEALTHY_FOOD_KEYWORDS.some(keyword => 
    normalizedName.includes(keyword)
  );
}

/**
 * Counts the number of unhealthy food items in a list of food logs
 * @param foodLogs Array of food log entries
 * @returns Number of unhealthy food items
 */
export function countUnhealthyFoods(foodLogs: Array<{ foodItem: string; identifiedFoodName?: string }>): number {
  return foodLogs.reduce((count, log) => {
    // Check both the original food item name and the identified name
    const foodName = log.identifiedFoodName || log.foodItem || '';
    return count + (isUnhealthyFood(foodName) ? 1 : 0);
  }, 0);
}

/**
 * Calculates penalty points for unhealthy foods
 * @param unhealthyFoodCount Number of unhealthy food items
 * @param penaltyPerItem Points deducted per unhealthy item (default: 3)
 * @returns Total penalty points
 */
export function calculateUnhealthyFoodPenalty(
  unhealthyFoodCount: number, 
  penaltyPerItem: number = 3
): number {
  return Math.max(0, unhealthyFoodCount * penaltyPerItem);
}

/**
 * Gets a list of unhealthy foods from food logs for display purposes
 * @param foodLogs Array of food log entries
 * @returns Array of unhealthy food names
 */
export function getUnhealthyFoodsList(foodLogs: Array<{ foodItem: string; identifiedFoodName?: string }>): string[] {
  return foodLogs
    .filter(log => {
      const foodName = log.identifiedFoodName || log.foodItem || '';
      return isUnhealthyFood(foodName);
    })
    .map(log => log.identifiedFoodName || log.foodItem);
}
