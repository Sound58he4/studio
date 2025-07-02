import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_DfdBeaZBeu6Ups",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "88aSx0tFYSBempejPntSvpOd",
});

// Define coupon configurations
const COUPON_CONFIGS = {
  'Bagom30': { plan: 'monthly', discount: 30 },
  'Bagoy50': { plan: 'yearly', discount: 50 },
  'Bagom10': { plan: 'monthly', finalAmount: 10 },
  'Bagom2': { plan: 'monthly', finalAmount: 2 },
  'bago99': { plan: 'both', discount: 99 },
  'BAGO99': { plan: 'both', discount: 99 },
  'Bago99': { plan: 'both', discount: 99 },
  'bago100': { plan: 'both', discount: 100 },
  'BAGO100': { plan: 'both', discount: 100 },
  'Bago100': { plan: 'both', discount: 100 },
} as const;

interface CreateOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  plan: 'monthly' | 'yearly';
  couponCode?: string;
  notes?: Record<string, any>;
}

function validateAndApplyCoupon(
  originalAmount: number, 
  plan: 'monthly' | 'yearly', 
  couponCode?: string
): { finalAmount: number; couponApplied: boolean; discountPercent: number } {
  if (!couponCode) {
    return { finalAmount: originalAmount, couponApplied: false, discountPercent: 0 };
  }

  const coupon = COUPON_CONFIGS[couponCode as keyof typeof COUPON_CONFIGS];
  
  if (!coupon) {
    return { finalAmount: originalAmount, couponApplied: false, discountPercent: 0 };
  }

  // Check if coupon is applicable to the selected plan
  if (coupon.plan !== 'both' && coupon.plan !== plan) {
    return { finalAmount: originalAmount, couponApplied: false, discountPercent: 0 };
  }

  // Calculate discount based on coupon type
  let discountAmount: number;
  let finalAmount: number;
  let discountPercent: number;

  if ('finalAmount' in coupon) {
    // Fixed amount coupon (Bagom10, Bagom2)
    finalAmount = coupon.finalAmount;
    discountAmount = originalAmount - finalAmount;
    discountPercent = Math.round((discountAmount / originalAmount) * 100);
  } else {
    // Percentage discount coupon
    discountAmount = (originalAmount * coupon.discount) / 100;
    finalAmount = Math.max(0, originalAmount - discountAmount);
    discountPercent = coupon.discount;
  }

  return { 
    finalAmount, 
    couponApplied: true, 
    discountPercent 
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { amount, currency, receipt, plan, couponCode, notes } = body;

    // Validate required fields
    if (!amount || !currency || !receipt || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, receipt, plan' },
        { status: 400 }
      );
    }

    // Apply coupon validation and calculate final amount
    const { finalAmount, couponApplied, discountPercent } = validateAndApplyCoupon(
      amount, 
      plan, 
      couponCode
    );

    // If the final amount is 0 due to 100% discount, create a mock order
    if (finalAmount === 0) {
      const mockOrder = {
        id: `order_free_${Date.now()}`,
        amount: 0,
        currency,
        receipt,
        status: 'created',
        coupon_applied: couponApplied,
        discount_percent: discountPercent,
        original_amount: amount,
        final_amount: finalAmount,
        is_free: true,
        notes: {
          ...notes,
          plan,
          coupon_code: couponCode,
          discount_applied: discountPercent,
        }
      };

      return NextResponse.json(mockOrder);
    }

    // Create Razorpay order for paid amounts
    const options = {
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency,
      receipt,
      notes: {
        ...notes,
        plan,
        coupon_code: couponCode || null,
        discount_applied: discountPercent,
        original_amount: amount,
        final_amount: finalAmount,
      },
    };

    const order = await razorpay.orders.create(options);

    // Add additional metadata to the response
    const orderResponse = {
      ...order,
      coupon_applied: couponApplied,
      discount_percent: discountPercent,
      original_amount: amount,
      final_amount: finalAmount,
      is_free: false,
    };

    return NextResponse.json(orderResponse);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error },
      { status: 500 }
    );
  }
}
