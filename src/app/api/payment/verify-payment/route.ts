import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
import { activateProSubscription, recordFailedPayment } from '@/services/firestore/subscriptionService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    // Validate phone number if provided
    if (customerContact) {
      const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
      if (!phoneRegex.test(customerContact)) {
        console.warn('Invalid phone number provided:', customerContact);
        return NextResponse.json(
          { status: 'error', message: 'Invalid phone number format. Please provide a valid 10-digit Indian mobile number.' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'User ID is required for subscription activation' },
        { status: 400 }
      );
    }

    // Handle free orders (100% discount)
    if (is_free || razorpay_order_id.startsWith('order_free_')) {
      // For free orders, we don't need Razorpay verification
      // Just validate that this is a legitimate free order
      if (razorpay_order_id.startsWith('order_free_')) {
        
        if (!paymentDetails) {
          return NextResponse.json(
            { status: 'error', message: 'Payment details required for subscription activation' },
            { status: 400 }
          );
        }

        try {
          // Activate pro subscription for free
          const subscriptionResult = await activateProSubscription(userId, {
            orderId: razorpay_order_id,
            amount: paymentDetails.amount,
            finalAmount: paymentDetails.finalAmount,
            couponCode: paymentDetails.couponCode,
            discountPercent: paymentDetails.discountPercent,
            subscriptionType: paymentDetails.subscriptionType,
            paymentMethod: 'free',
          });

          console.log('Free subscription activated:', {
            userId,
            order_id: razorpay_order_id,
            expiryDate: subscriptionResult.expiryDate,
            timestamp: new Date().toISOString(),
          });

          return NextResponse.json({ 
            status: 'ok', 
            message: subscriptionResult.message,
            order_id: razorpay_order_id,
            payment_type: 'free',
            subscription: {
              isPro: true,
              expiryDate: subscriptionResult.expiryDate.toISOString(),
              subscriptionType: paymentDetails.subscriptionType,
            }
          });
        } catch (subscriptionError: any) {
          console.error('Error activating free subscription:', subscriptionError);
          return NextResponse.json(
            { status: 'error', message: 'Failed to activate free subscription' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { status: 'error', message: 'Invalid free order ID' },
        { status: 400 }
      );
    }

    // Validate required fields for paid orders
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'zSqRMpIa2ljBBpkieFYGmfLa';
    const body_signature = razorpay_order_id + '|' + razorpay_payment_id;

    console.log('Payment verification details:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      userId: userId,
      body_signature: body_signature,
      signature_provided: razorpay_signature,
      timestamp: new Date().toISOString(),
    });

    try {
      const isValidSignature = validateWebhookSignature(
        body_signature, 
        razorpay_signature, 
        secret
      );

      if (isValidSignature) {
        // Payment verified successfully
        console.log('Payment verification successful:', {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          timestamp: new Date().toISOString(),
        });

        // Activate pro subscription for paid order
        if (paymentDetails) {
          try {
            const subscriptionResult = await activateProSubscription(userId, {
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              amount: paymentDetails.amount,
              finalAmount: paymentDetails.finalAmount,
              couponCode: paymentDetails.couponCode,
              discountPercent: paymentDetails.discountPercent,
              subscriptionType: paymentDetails.subscriptionType,
              paymentMethod: 'razorpay',
            });

            console.log('Pro subscription activated for paid order:', {
              userId,
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              expiryDate: subscriptionResult.expiryDate,
            });

            return NextResponse.json({ 
              status: 'ok', 
              message: subscriptionResult.message,
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              payment_type: 'paid',
              subscription: {
                isPro: true,
                expiryDate: subscriptionResult.expiryDate.toISOString(),
                subscriptionType: paymentDetails.subscriptionType,
              }
            });
          } catch (subscriptionError: any) {
            console.error('Error activating paid subscription:', subscriptionError);
            // Payment was successful but subscription activation failed
            return NextResponse.json(
              { 
                status: 'payment_ok_subscription_failed', 
                message: 'Payment successful but subscription activation failed. Please contact support.',
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id,
              },
              { status: 500 }
            );
          }
        }

        // Fallback response if no payment details provided
        return NextResponse.json({ 
          status: 'ok', 
          message: 'Payment verified successfully',
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          payment_type: 'paid'
        });
      } else {
        console.error('Payment verification failed:', {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          timestamp: new Date().toISOString(),
        });

        // Record failed payment if details are available
        if (paymentDetails && userId) {
          try {
            await recordFailedPayment(userId, {
              orderId: razorpay_order_id,
              amount: paymentDetails.amount,
              finalAmount: paymentDetails.finalAmount,
              couponCode: paymentDetails.couponCode,
              discountPercent: paymentDetails.discountPercent,
              subscriptionType: paymentDetails.subscriptionType,
              paymentMethod: 'razorpay',
              errorMessage: 'Payment signature verification failed',
            });
          } catch (recordError) {
            console.error('Error recording failed payment:', recordError);
          }
        }

        return NextResponse.json(
          { status: 'verification_failed', message: 'Payment signature verification failed' },
          { status: 400 }
        );
      }
    } catch (verificationError) {
      console.error('Error during signature verification:', verificationError);
      return NextResponse.json(
        { status: 'error', message: 'Error during payment verification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
