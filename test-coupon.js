// Test script for coupon validation
const testCoupon = async (couponCode, plan, originalAmount) => {
  try {
    const response = await fetch('http://localhost:3000/api/payment/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        couponCode,
        plan,
        originalAmount
      })
    });

    const result = await response.json();
    console.log(`\n=== Testing Coupon: ${couponCode} ===`);
    console.log(`Plan: ${plan}`);
    console.log(`Original Amount: ₹${originalAmount}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.valid && result.pricing) {
      console.log(`✅ Final Amount: ₹${result.pricing.final_amount}`);
      console.log(`💰 Savings: ₹${result.pricing.savings}`);
    }
  } catch (error) {
    console.error('Error testing coupon:', error);
  }
};

// Test the yearly coupon
const testYearlyCoupon = async () => {
  console.log('🧪 Testing Yearly Coupon: Bagoy50');
  await testCoupon('Bagoy50', 'yearly', 2000);
};

// Test the monthly coupon
const testMonthlyCoupon = async () => {
  console.log('🧪 Testing Monthly Coupon: Bagom10');
  await testCoupon('Bagom10', 'monthly', 200);
};

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  console.log('🚀 Starting Coupon Tests...');
  testYearlyCoupon();
  testMonthlyCoupon();
}