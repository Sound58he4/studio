/**
 * Test script to verify pro subscription activation and Firestore updates
 * Run with: node test-pro-subscription.js
 */

// Test data for a free subscription activation
const testPaymentData = {
  userId: "test_user_123",
  paymentDetails: {
    orderId: "order_free_test_123",
    amount: 299,
    finalAmount: 0,
    couponCode: "bago100",
    discountPercent: 100,
    subscriptionType: "monthly",
    paymentMethod: "free"
  }
};

// Test data for a paid subscription activation
const testPaidPaymentData = {
  userId: "test_user_456",
  paymentDetails: {
    orderId: "order_paid_test_456",
    paymentId: "pay_test_456",
    amount: 299,
    finalAmount: 209.30,
    couponCode: "Bagom30",
    discountPercent: 30,
    subscriptionType: "monthly",
    paymentMethod: "razorpay"
  }
};

// Test API endpoint
const testApiEndpoint = async (endpoint, data) => {
  try {
    console.log(`\n=== Testing ${endpoint} ===`);
    console.log('Request data:', JSON.stringify(data, null, 2));
    
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed');
    } else {
      console.log('❌ Test failed');
    }
    
    return { success: response.ok, data: result };
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Pro Subscription Integration Tests');
  console.log('================================================');

  // Test 1: Create free order (100% discount)
  await testApiEndpoint('/api/payment/create-order', {
    amount: 299,
    currency: 'INR',
    receipt: 'test_receipt_free',
    plan: 'monthly',
    couponCode: 'bago100',
    notes: {
      test: true,
      plan: 'monthly'
    }
  });

  // Test 2: Verify free payment (should activate pro subscription)
  await testApiEndpoint('/api/payment/verify-payment', {
    razorpay_order_id: 'order_free_test_123',
    is_free: true,
    userId: testPaymentData.userId,
    paymentDetails: testPaymentData.paymentDetails
  });

  // Test 3: Create paid order with discount
  await testApiEndpoint('/api/payment/create-order', {
    amount: 299,
    currency: 'INR',
    receipt: 'test_receipt_paid',
    plan: 'monthly',
    couponCode: 'Bagom30',
    notes: {
      test: true,
      plan: 'monthly'
    }
  });

  // Test 4: Validate coupon
  await testApiEndpoint('/api/payment/validate-coupon', {
    couponCode: 'Bagom30',
    plan: 'monthly',
    originalAmount: 299
  });

  console.log('\n🏁 Tests completed');
  console.log('================================================');
  console.log('📋 Summary:');
  console.log('- Free subscription activation should save isPro: true to Firestore');
  console.log('- Pro expiry date should be calculated and saved');
  console.log('- Payment history should be recorded in proPaymentHistory array');
  console.log('- Check your Firestore console to verify the data was saved correctly');
};

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

module.exports = { runTests, testApiEndpoint };
