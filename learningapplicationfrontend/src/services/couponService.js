import { apiFetch } from './api';

export const couponService = {
  validateCoupon: (code) => apiFetch(`/coupons/validate?code=${code}`),
};
