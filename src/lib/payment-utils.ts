// Payment configuration and utilities
export const RAZORPAY_CONFIG = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ,
  company_name: 'Bago Fitness Pro',
  company_description: 'Pro Subscription - Advanced Fitness Features',
  theme_color: '#3b82f6',
};

export const COUPON_CODES = [
  'Bagom30',
  'Bagoy50', 
  'bago100',
  'BAGO100',
  'Bago100',
] as const;

export const PLAN_PRICES = {
  monthly: 200,
  yearly: 2000,
} as const;

export const formatPrice = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const calculateSavings = (originalAmount: number, finalAmount: number): number => {
  return originalAmount - finalAmount;
};

export const calculateDiscountPercent = (originalAmount: number, finalAmount: number): number => {
  if (originalAmount === 0) return 0;
  return Math.round(((originalAmount - finalAmount) / originalAmount) * 100);
};
