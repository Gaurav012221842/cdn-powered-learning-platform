import { apiFetch } from './api';

export const paymentService = {
  initiatePayment: (userId, courseId, amount) => apiFetch(`/payments/initiate?userId=${userId}&courseId=${courseId}&amount=${amount}`, { method: 'POST' }),
  verifyPayment: (razorpayOrderId, razorpayPaymentId, signature) => apiFetch(`/payments/verify?razorpayOrderId=${razorpayOrderId}&razorpayPaymentId=${razorpayPaymentId}&signature=${signature}`, { method: 'POST' }),
};
