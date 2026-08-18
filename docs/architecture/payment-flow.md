# Payment Flow Architecture

1. Student initiates purchase with coupon / campaign discount.
2. Backend creates Razorpay order reference.
3. Student completes checkout on frontend via Razorpay SDK.
4. Razorpay sends signature & webhook to backend.
5. Backend verifies signature, grants course enrollment, and publishes enrollment event.
