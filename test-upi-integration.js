/**
 * UPI Payment Integration Test
 * This script helps verify UPI payment handling in Razorpay integration
 */

// Test UPI payment flow
const testUPIPayment = async () => {
  console.log('🔄 Testing UPI Payment Integration');
  console.log('=====================================');

  // Test data for UPI payment
  const testData = {
    amount: 299,
    currency: 'INR',
    receipt: 'upi_test_receipt_' + Date.now(),
    plan: 'monthly',
    couponCode: 'bago99', // 99% discount for testing
    notes: {
      test: true,
      payment_method: 'upi',
      plan: 'monthly'
    }
  };

  try {
    // Step 1: Create order
    console.log('\n1️⃣ Creating Razorpay order...');
    const orderResponse = await fetch('http://localhost:3000/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const order = await orderResponse.json();
    console.log('Order created:', {
      id: order.id,
      amount: order.amount,
      final_amount: order.final_amount,
      is_free: order.is_free,
      coupon_applied: order.coupon_applied,
      discount_percent: order.discount_percent,
    });

    if (order.is_free) {
      console.log('✅ Order is free - no UPI payment needed');
      return;
    }

    // Step 2: Simulate UPI payment details
    console.log('\n2️⃣ Simulating UPI payment completion...');
    
    // Note: In real scenario, these would come from Razorpay after successful UPI payment
    const simulatedUPIResponse = {
      razorpay_order_id: order.id,
      razorpay_payment_id: 'pay_upi_test_' + Date.now(),
      razorpay_signature: 'simulated_signature_for_testing',
      userId: 'test_user_upi_123',
      paymentDetails: {
        amount: testData.amount,
        finalAmount: order.final_amount,
        couponCode: testData.couponCode,
        discountPercent: order.discount_percent,
        subscriptionType: testData.plan,
      }
    };

    console.log('UPI Payment simulation data:', {
      order_id: simulatedUPIResponse.razorpay_order_id,
      payment_id: simulatedUPIResponse.razorpay_payment_id,
      user_id: simulatedUPIResponse.userId,
      amount: simulatedUPIResponse.paymentDetails.finalAmount,
    });

    // Step 3: Test payment verification
    console.log('\n3️⃣ Testing payment verification...');
    console.log('⚠️  Note: This will fail signature verification (expected for test)');
    
    const verifyResponse = await fetch('http://localhost:3000/api/payment/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulatedUPIResponse),
    });

    const verificationResult = await verifyResponse.json();
    console.log('Verification result:', {
      status: verificationResult.status,
      message: verificationResult.message,
      response_code: verifyResponse.status,
    });

    // Step 4: UPI-specific recommendations
    console.log('\n4️⃣ UPI Integration Recommendations:');
    console.log('=====================================');
    console.log('✅ Enable all UPI payment methods in Razorpay options');
    console.log('✅ Set proper timeout (5 minutes for UPI)');
    console.log('✅ Enable retry mechanism for failed UPI payments');
    console.log('✅ Add specific UPI error handling');
    console.log('✅ Log payment responses for debugging');
    console.log('✅ Handle UPI payment status polling if needed');

    // Step 5: Common UPI issues and solutions
    console.log('\n5️⃣ Common UPI Issues & Solutions:');
    console.log('=================================');
    console.log('🔧 Issue: UPI payment not completing');
    console.log('   Solution: Increase timeout, enable retry, check UPI app status');
    console.log('🔧 Issue: Payment successful but verification fails');
    console.log('   Solution: Check signature validation, verify webhook setup');
    console.log('🔧 Issue: UPI option not showing');
    console.log('   Solution: Verify Razorpay account UPI settings, check payment methods config');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Enhanced Razorpay UPI configuration example
const upiOptimizedConfig = {
  key: 'YOUR_RAZORPAY_KEY',
  amount: 299 * 100, // Amount in paise
  currency: 'INR',
  name: 'Bago Fitness Pro',
  description: 'Pro Subscription',
  order_id: 'order_xyz',
  
  // UPI-optimized settings
  method: {
    upi: true,
    card: true,
    netbanking: true,
    wallet: true,
  },
  
  // Enhanced UPI configuration
  config: {
    display: {
      blocks: {
        upi: {
          name: 'Pay by UPI',
          instruments: [
            { method: 'upi' }
          ],
        },
        other: {
          name: 'Other Payment Methods', 
          instruments: [
            { method: 'card' },
            { method: 'netbanking' },
            { method: 'wallet' }
          ],
        },
      },
      sequence: ['block.upi', 'block.other'], // Prioritize UPI
      preferences: {
        show_default_blocks: true,
      },
    },
  },
  
  // UPI-specific modal settings
  modal: {
    ondismiss: function() {
      console.log('UPI payment dismissed');
    },
    confirm_close: true,
    escape: true,
    backdropclose: false,
  },
  
  // Extended timeout for UPI
  timeout: 300, // 5 minutes
  
  // Retry mechanism for UPI failures
  retry: {
    enabled: true,
    max_count: 3,
  },
  
  // Handler for successful payments
  handler: function(response) {
    console.log('UPI Payment successful:', response);
    // Verify payment on server
  },
  
  // Prefill UPI-related info
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9999999999',
  },
  
  theme: {
    color: '#3b82f6'
  }
};

console.log('\n📋 UPI-Optimized Razorpay Config:');
console.log('=================================');
console.log(JSON.stringify(upiOptimizedConfig, null, 2));

// Run the test
if (typeof window === 'undefined') {
  // Running in Node.js environment
  testUPIPayment().catch(console.error);
} else {
  // Running in browser
  console.log('Run this in Node.js environment: node test-upi-integration.js');
}

module.exports = { testUPIPayment, upiOptimizedConfig };
