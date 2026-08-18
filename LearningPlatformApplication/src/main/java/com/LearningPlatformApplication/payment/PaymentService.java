package com.LearningPlatformApplication.payment;

import com.LearningPlatformApplication.enrollment.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RazorpayService razorpayService;
    private final EnrollmentService enrollmentService;

    public Payment initiatePayment(UUID userId, String userEmail, UUID courseId, BigDecimal amount) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        String orderId = razorpayService.createOrder(amount, "INR");
        Payment payment = Payment.builder()
                .userId(validUserId)
                .courseId(courseId)
                .amount(amount != null ? amount : new BigDecimal("49.99"))
                .razorpayOrderId(orderId)
                .status(PaymentStatus.PENDING)
                .build();
        return paymentRepository.save(payment);
    }

    public Payment completePayment(String razorpayOrderId, String razorpayPaymentId, String signature, UUID userId, String userEmail, UUID courseId, BigDecimal amount) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .userId(validUserId)
                        .courseId(courseId != null ? courseId : UUID.randomUUID())
                        .amount(amount != null ? amount : new BigDecimal("49.99"))
                        .razorpayOrderId(razorpayOrderId)
                        .status(PaymentStatus.PENDING)
                        .build()));

        if (razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, signature)) {
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(payment);
            if (payment.getUserId() != null && payment.getCourseId() != null) {
                enrollmentService.enrollStudent(payment.getUserId(), userEmail, payment.getCourseId());
            }
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
        return payment;
    }

    public List<Payment> getUserPayments(UUID userId, String userEmail) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        return paymentRepository.findByUserId(validUserId);
    }
}
