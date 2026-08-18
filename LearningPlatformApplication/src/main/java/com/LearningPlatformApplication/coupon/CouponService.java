package com.LearningPlatformApplication.coupon;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public Coupon validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        if (coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new RuntimeException("Coupon usage limit reached");
        }
        return coupon;
    }

    public Coupon createCoupon(String code, BigDecimal discountAmount) {
        Coupon coupon = Coupon.builder()
                .code(code.toUpperCase())
                .discountAmount(discountAmount)
                .build();
        return couponRepository.save(coupon);
    }
}
