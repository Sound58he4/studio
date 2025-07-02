// Test script to debug coupon validation
const testCoupon = async () => {
  const response = await fetch('http://localhost:9002/api/payment/validate-coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      couponCode: 'Bagoy50',
      plan: 'yearly',
      originalAmount: 2000,
    }),
  });

  const result = await response.json();
  console.log('Response status:', response.status);
  console.log('Response body:', JSON.stringify(result, null, 2));
};

testCoupon().catch(console.error);
