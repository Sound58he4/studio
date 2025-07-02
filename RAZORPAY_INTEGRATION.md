# Razorpay Integration Documentation

## Overview
This document explains the Razorpay payment integration implemented in the Bago Fitness Pro upgrade page. The integration supports both paid subscriptions and free subscriptions through coupon codes, with server-side validation.

## Features Implemented

### 1. **Server-Side Coupon Validation**
- Coupon codes are validated on the server to prevent client-side manipulation
- Different coupons for different plans (monthly/yearly/both)
- Support for 100% discount coupons that skip payment entirely

### 2. **Supported Coupon Codes**
- `Bagom30`: 30% off Monthly Plan
- `Bagom10`: Monthly Plan for just ₹10 (95% off)
- `Bagom2`: Monthly Plan for just ₹2 (99% off)
- `Bagoy50`: 50% off Yearly Plan  
- `bago100`/`BAGO100`/`Bago100`: 100% off (completely free) - works on both plans

### 3. **Payment Flow**
1. User selects a plan (Monthly Warrior ₹200 or Annual Champion ₹2000)
2. User optionally applies a coupon code
3. Server validates the coupon and calculates final amount
4. If final amount is 0 (100% discount), subscription is activated immediately
5. If final amount > 0, Razorpay payment gateway is opened
6. After successful payment, server verifies the payment signature
7. User's subscription is activated

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── payment/
│   │       ├── create-order/route.ts      # Creates Razorpay order
│   │       ├── verify-payment/route.ts    # Verifies payment signature
│   │       └── validate-coupon/route.ts   # Validates coupon codes
│   └── pro-upgrade/
│       └── page.tsx                       # Main upgrade page
├── hooks/
│   └── use-razorpay.ts                   # Custom hook for Razorpay
├── lib/
│   └── payment-utils.ts                  # Payment utility functions
└── types/
    └── razorpay.d.ts                     # TypeScript declarations
```

## API Endpoints

### POST `/api/payment/create-order`
Creates a new Razorpay order or mock order for free subscriptions.

**Request Body:**
```json
{
  "amount": 200,
  "currency": "INR",
  "receipt": "receipt_123",
  "plan": "monthly",
  "couponCode": "bago100",
  "notes": {}
}
```

**Response:**
```json
{
  "id": "order_123",
  "amount": 0,
  "currency": "INR",
  "receipt": "receipt_123",
  "status": "created",
  "coupon_applied": true,
  "discount_percent": 100,
  "original_amount": 200,
  "final_amount": 0,
  "is_free": true
}
```

### POST `/api/payment/verify-payment`
Verifies payment signature or activates free subscription.

**Request Body (Paid):**
```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123"
}
```

**Request Body (Free):**
```json
{
  "razorpay_order_id": "order_free_123",
  "is_free": true
}
```

### POST `/api/payment/validate-coupon`
Validates coupon codes and calculates discounts.

**Request Body:**
```json
{
  "couponCode": "bago100",
  "plan": "monthly",
  "originalAmount": 200
}
```

## Environment Variables

Create a `.env.local` file with:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Note:** Replace the test keys with your actual Razorpay credentials.

## Security Features

1. **Server-Side Validation**: All coupon validation happens on the server
2. **Payment Signature Verification**: Uses Razorpay's signature verification
3. **Amount Validation**: Server calculates final amounts to prevent tampering
4. **Error Handling**: Comprehensive error handling throughout the flow

## Usage Example

```typescript
// In your component
const { initiatePayment, validateCoupon, loading } = useRazorpay({
  key: 'your_razorpay_key',
  name: 'Your Company',
  description: 'Subscription Payment',
});

// Validate coupon
const result = await validateCoupon('bago100', 'monthly', 200);

// Initiate payment
const paymentResult = await initiatePayment({
  amount: 200,
  plan: 'monthly',
  couponCode: 'bago100'
});
```

## Testing

### Test Coupon Codes:
- `bago100` - 100% discount (free subscription)
- `Bagom30` - 30% discount on monthly plan
- `Bagoy50` - 50% discount on yearly plan

### Test Cards (Razorpay Test Mode):
- Success: `4111111111111111`
- Failure: `4000000000000002`

## Production Deployment

1. Replace test Razorpay keys with live keys
2. Update webhook URLs in Razorpay dashboard
3. Implement proper user authentication and subscription management
4. Add database integration for storing subscription details
5. Implement email notifications for successful subscriptions

## Error Handling

The integration includes comprehensive error handling for:
- Invalid coupon codes
- Payment failures
- Network errors
- Server errors
- User cancellation

## Mobile Responsiveness

The UI is fully responsive and optimized for:
- Mobile devices (phone screens)
- Tablets
- Desktop browsers

## Additional Features

1. **Loading States**: Proper loading indicators during payment processing
2. **Toast Notifications**: User-friendly success/error messages
3. **Coupon Hints**: Helpful hints for users about available coupons
4. **Security Indicators**: Payment security information display
5. **Real-time Validation**: Instant coupon validation feedback
