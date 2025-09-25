import { NextRequest, NextResponse } from 'next/server';
// Database imports disabled for FREE MODE
// import Razorpay from 'razorpay';
// import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
// import { activateProSubscription, recordFailedPayment } from '@/services/firestore/subscriptionService';

// Razorpay disabled for FREE MODE
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  is_free?: boolean;
  userId?: string;
  customerContact?: string; // Add customer contact
  paymentDetails?: {
    amount: number;
    finalAmount: number;
    couponCode?: string;
    discountPercent?: number;
    subscriptionType: 'monthly' | 'yearly';
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      is_free,
      userId,
      customerContact,
      paymentDetails
    } = body;

    // DATABASE DISABLED MODE: Always return successful subscription activation
    console.log('Payment verification in FREE MODE - Database disabled');
    console.log('Request details:', {
      userId,
      razorpay_order_id,
      is_free,
      paymentDetails: paymentDetails ? {
        subscriptionType: paymentDetails.subscriptionType,
        finalAmount: paymentDetails.finalAmount
      } : null
    });

    // Store subscription info in localStorage for client-side access
    const subscriptionData = {
      isPro: true,
      subscriptionType: paymentDetails?.subscriptionType || 'monthly',
      activatedAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + (paymentDetails?.subscriptionType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      userId: userId,
      orderId: razorpay_order_id
    };

    // Validate phone number if provided (still validate for logging purposes)
    if (customerContact) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(customerContact)) {
        console.warn('Invalid phone number provided:', customerContact);
      }
    }

    // Basic validation
    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'User ID is required for subscription activation' },
        { status: 400 }
      );
    }

    // Handle free orders or any order (DATABASE DISABLED MODE)
    if (is_free || razorpay_order_id.startsWith('order_free_') || true) {
      // In free mode, all subscriptions are activated without database calls
      
      if (!paymentDetails) {
        // Use default payment details if not provided
        const defaultPaymentDetails = {
          subscriptionType: 'monthly' as const,
          amount: 0,
          finalAmount: 0
        };
        
        console.log('Free subscription activated (FREE MODE):', {
          userId,
          order_id: razorpay_order_id,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ 
          status: 'ok', 
          message: 'Free subscription activated successfully',
          order_id: razorpay_order_id,
          payment_type: 'free',
          subscription: {
            isPro: true,
            expiryDate: subscriptionData.expiryDate,
            subscriptionType: defaultPaymentDetails.subscriptionType,
          }
        });
      }

      console.log('Subscription activated (FREE MODE):', {
        userId,
        order_id: razorpay_order_id,
        subscriptionType: paymentDetails.subscriptionType,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ 
        status: 'ok', 
        message: `${paymentDetails.subscriptionType} subscription activated successfully`,
        order_id: razorpay_order_id,
        payment_type: paymentDetails.finalAmount === 0 ? 'free' : 'paid',
        subscription: {
          isPro: true,
          expiryDate: subscriptionData.expiryDate,
          subscriptionType: paymentDetails.subscriptionType,
        }
      });
    }

    // DATABASE DISABLED MODE: Skip all payment verification and database operations
    // Simply log the request and return success
    console.log('Payment verification skipped in FREE MODE:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Payment processed successfully (FREE MODE)',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      payment_type: 'free_mode',
      subscription: {
        isPro: true,
        expiryDate: subscriptionData.expiryDate,
        subscriptionType: paymentDetails?.subscriptionType || 'monthly',
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
