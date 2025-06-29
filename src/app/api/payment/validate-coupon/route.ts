import { NextRequest, NextResponse } from 'next/server';

// Define coupon configurations
const COUPON_CONFIGS = {
  'Bagom30': { plan: 'monthly', discount: 30, description: '30% off Monthly Plan' },
  'Bagoy50': { plan: 'yearly', discount: 50, description: '50% off Yearly Plan' },
  'bago99': { plan: 'both', discount: 99, description: '99% off - Almost Free!' },
  'BAGO99': { plan: 'both', discount: 99, description: '99% off - Almost Free!' },
  'Bago99': { plan: 'both', discount: 99, description: '99% off - Almost Free!' },
  'bago100': { plan: 'both', discount: 100, description: '100% off - Completely Free!' },
  'BAGO100': { plan: 'both', discount: 100, description: '100% off - Completely Free!' },
  'Bago100': { plan: 'both', discount: 100, description: '100% off - Completely Free!' },
} as const;

interface ValidateCouponRequest {
  couponCode: string;
  plan: 'monthly' | 'yearly';
  originalAmount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateCouponRequest = await request.json();
    const { couponCode, plan, originalAmount } = body;

    // Validate required fields
    if (!couponCode || !plan || !originalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: couponCode, plan, originalAmount' },
        { status: 400 }
      );
    }

    // Check if coupon exists
    const coupon = COUPON_CONFIGS[couponCode as keyof typeof COUPON_CONFIGS];
    
    if (!coupon) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid coupon code',
          message: 'The coupon code you entered is not valid.' 
        },
        { status: 400 }
      );
    }

    // Check if coupon is applicable to the selected plan
    if (coupon.plan !== 'both' && coupon.plan !== plan) {
      const requiredPlan = coupon.plan === 'monthly' ? 'Monthly' : 'Yearly';
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Coupon not applicable to selected plan',
          message: `This coupon is only valid for the ${requiredPlan} plan.` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    const discountAmount = (originalAmount * coupon.discount) / 100;
    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        code: couponCode,
        discount: coupon.discount,
        description: coupon.description,
        applicable_plan: coupon.plan,
      },
      pricing: {
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        savings: discountAmount,
      },
      is_free: finalAmount === 0,
      message: finalAmount === 0 
        ? 'Congratulations! Your subscription is completely free!' 
        : `Great! You saved ₹${discountAmount} with this coupon.`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', details: error },
      { status: 500 }
    );
  }
}
