import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRazorpayOptions {
  key: string;
  name: string;
  description: string;
  userId: string; // Add userId to options
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  // Add phone verification options
  phoneVerification?: {
    enabled: boolean;
    required: boolean;
  };
}

interface PaymentDetails {
  amount: number;
  plan: 'monthly' | 'yearly';
  couponCode?: string;
}

interface OrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  coupon_applied: boolean;
  discount_percent: number;
  original_amount: number;
  final_amount: number;
  is_free: boolean;
  notes?: Record<string, any>;
  error?: string;
}

export const useRazorpay = (options: UseRazorpayOptions) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initiatePayment = useCallback(async (paymentDetails: PaymentDetails): Promise<{
    success: boolean;
    order_id: string;
    payment_id?: string;
    payment_type: 'free' | 'paid';
    amount: number;
    discount_applied: number;
    customer_contact?: string; // Add customer_contact to return type
  }> => {
    setLoading(true);
    
    try {
      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentDetails.amount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          plan: paymentDetails.plan,
          couponCode: paymentDetails.couponCode,
          notes: {
            plan: paymentDetails.plan,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const order: OrderResponse = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(order.error || 'Failed to create order');
      }

      // Handle free orders (100% discount)
      if (order.is_free) {
        toast({
          title: "🎉 Free Subscription Activated!",
          description: "Your coupon gave you a 100% discount. Enjoy your free subscription!",
          duration: 8000,
        });

        // Verify the free order
        const verifyResponse = await fetch('/api/payment/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_order_id: order.id,
            is_free: true,
            userId: options.userId,
            paymentDetails: {
              amount: paymentDetails.amount,
              finalAmount: order.final_amount,
              couponCode: paymentDetails.couponCode,
              discountPercent: order.discount_percent,
              subscriptionType: paymentDetails.plan,
            },
          }),
        });

        const verificationResult = await verifyResponse.json();
        
        if (verificationResult.status === 'ok') {
          return {
            success: true,
            order_id: order.id,
            payment_type: 'free',
            amount: 0,
            discount_applied: order.discount_percent,
          };
        } else {
          throw new Error('Failed to activate free subscription');
        }
      }

      // Handle paid orders with Razorpay
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const razorpayOptions = {
            key: options.key,
            amount: order.amount,
            currency: order.currency,
            name: options.name,
            description: options.description,
            order_id: order.id,
            prefill: options.prefill,
            theme: options.theme,
            method: {
              netbanking: true,
              card: true,
              upi: true,
              wallet: true,
              paylater: true,
              // Enable all payment methods for better UPI support
            },
            config: {
              display: {
                blocks: {
                 
                  other: { // Other payment methods
                    name: 'Other Payment Methods',
                    instruments: [
                      { method: 'card' },
                      { method: 'netbanking' },
                      { method: 'upi' },
                      { method: 'wallet' }
                    ],
                  },
                },
                hide: [
                    "qr"
                ],
                sequence: [ 'block.other'],
                preferences: {
                  show_default_blocks: true, // Show default payment blocks
                },
              },
            },
            // Enhanced customer validation
            customer_additional_info: {
              billing_address: {
                line1: 'Fitness Address',
                line2: 'Pro Subscription',
                city: 'Fitness City',
                state: 'Active',
                country: 'IN',
                postal_code: '400001'
              }
            },
            // Phone number validation
            readonly: {
              email: false,
              name: false,
              contact: false, // Allow editing but validate
            },
            // Custom validation rules
            validate: {
              email: true,
              name: true,
              contact: true, // Enable contact validation
            },
            // Phone number specific configuration
            send_sms_hash: true, // Enable SMS hash for OTP
            allow_rotation: true, // Allow screen rotation
            handler: async (response: any) => {
              try {
                console.log('Razorpay payment response:', response);
                
                // Validate phone number from response if available
                if (response.contact && response.contact.length !== 10) {
                  toast({
                    title: "⚠️ Invalid Phone Number",
                    description: "Please ensure you've entered a valid 10-digit phone number.",
                    duration: 6000,
                  });
                  throw new Error('Invalid phone number provided');
                }
                
                // Verify payment
                const verifyResponse = await fetch('/api/payment/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: options.userId,
                    customerContact: response.contact, // Include phone number
                    paymentDetails: {
                      amount: paymentDetails.amount,
                      finalAmount: order.final_amount,
                      couponCode: paymentDetails.couponCode,
                      discountPercent: order.discount_percent,
                      subscriptionType: paymentDetails.plan,
                    },
                  }),
                });

                const verificationResult = await verifyResponse.json();
                console.log('Payment verification result:', verificationResult);

                if (verificationResult.status === 'ok') {
                  toast({
                    title: "✅ Payment Successful!",
                    description: "Your Pro subscription is now active. Welcome to Pro!",
                    duration: 8000,
                  });

                  resolve({
                    success: true,
                    order_id: response.razorpay_order_id,
                    payment_id: response.razorpay_payment_id,
                    payment_type: 'paid',
                    amount: order.final_amount,
                    discount_applied: order.discount_percent,
                    customer_contact: response.contact,
                  });
                } else {
                  console.error('Payment verification failed:', verificationResult);
                  throw new Error(verificationResult.message || 'Payment verification failed');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast({
                  title: "❌ Payment Verification Failed",
                  description: "There was an issue verifying your payment. Please contact support.",
                  duration: 8000,
                });
                reject(error);
              }
            },
            modal: {
              ondismiss: () => {
                console.log('Payment modal dismissed by user');
                toast({
                  title: "Payment Cancelled",
                  description: "You cancelled the payment process.",
                  duration: 4000,
                });
                reject(new Error('Payment cancelled by user'));
              },
              confirm_close: true, // Ask for confirmation before closing
              escape: true, // Allow ESC key to close
              backdropclose: false, // Don't close on backdrop click
            },
            retry: {
              enabled: true,
              max_count: 3, // Allow up to 3 retry attempts
            },
            timeout: 300, // 5 minutes timeout
            remember_customer: false,
          };

          const rzp = new (window as any).Razorpay(razorpayOptions);
          rzp.open();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Razorpay SDK'));
        };
        
        document.body.appendChild(script);
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "❌ Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        duration: 6000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  const validateCoupon = useCallback(async (couponCode: string, plan: 'monthly' | 'yearly', originalAmount: number) => {
    try {
      const response = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode,
          plan,
          originalAmount,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          valid: false,
          error: result.error || 'Invalid coupon',
          message: result.message || 'The coupon code is not valid.',
        };
      }

      return result;
    } catch (error) {
      console.error('Coupon validation error:', error);
      return {
        valid: false,
        error: 'Validation failed',
        message: 'Failed to validate coupon. Please try again.',
      };
    }
  }, []);

  return {
    initiatePayment,
    validateCoupon,
    loading,
  };
};
