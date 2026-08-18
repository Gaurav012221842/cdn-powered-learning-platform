package com.LearningPlatformApplication.pricing;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final PricingRepository pricingRepository;

    public CoursePricing getPricingByCourseId(UUID courseId) {
        return pricingRepository.findByCourseId(courseId)
                .orElseGet(() -> CoursePricing.builder()
                        .courseId(courseId)
                        .basePrice(BigDecimal.ZERO)
                        .currency("USD")
                        .build());
    }

    public CoursePricing setCoursePricing(UUID courseId, BigDecimal basePrice, BigDecimal discountPrice) {
        CoursePricing pricing = pricingRepository.findByCourseId(courseId)
                .orElse(CoursePricing.builder().courseId(courseId).build());

        pricing.setBasePrice(basePrice);
        pricing.setDiscountPrice(discountPrice);
        return pricingRepository.save(pricing);
    }
}
