/**
 * @fileOverview Estimates calories burned for a specific exercise based on its details and user profile.
 * Now uses MET-based calculations instead of AI for faster, more accurate results.
 *
 * - estimateCaloriesBurned - Function to estimate calories burned.
 * - EstimateCaloriesBurnedInput - Input type for the function.
 * - EstimateCaloriesBurnedOutput - Return type for the function.
 */

// Re-export from the MET-based implementation
export { 
  estimateCaloriesBurned, 
  type EstimateCaloriesBurnedInput, 
  type EstimateCaloriesBurnedOutput 
} from './estimate-calories-burned-met';