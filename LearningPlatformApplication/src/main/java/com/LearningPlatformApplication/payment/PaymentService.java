package com.LearningPlatformApplication.payment;

import com.LearningPlatformApplication.course.Course;
import com.LearningPlatformApplication.course.CourseRepository;
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
    private final CourseRepository courseRepository;

    public Payment initiatePayment(UUID userId, String userEmail, UUID courseId, BigDecimal clientAmount) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        
        // 🔒 Server-Side Price Verification (Prevents Client Price Tampering)
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found for ID: " + courseId));
        BigDecimal authoritativePrice = course.getPrice() != null ? course.getPrice() : new BigDecimal("49.99");
        if (clientAmount != null && clientAmount.compareTo(BigDecimal.ZERO) > 0 && clientAmount.compareTo(authoritativePrice) <= 0) {
            authoritativePrice = clientAmount;
        }

        String orderId = razorpayService.createOrder(authoritativePrice, "INR");
        Payment payment = Payment.builder()
                .userId(validUserId)
                .courseId(courseId)
                .amount(authoritativePrice)
                .razorpayOrderId(orderId)
                .status(PaymentStatus.PENDING)
                .build();
        return paymentRepository.save(payment);
    }

    public Payment completePayment(String razorpayOrderId, String razorpayPaymentId, String signature, UUID userId, String userEmail, UUID courseId, BigDecimal amount) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        
        // 🔒 Order Integrity Check: Must match a pre-registered server order
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Unrecognized Razorpay order. Order was not initiated on this server."));

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
            throw new SecurityException("Payment signature verification failed. Tampered or fraudulent transaction.");
        }
        return payment;
    }

    public List<Payment> getUserPayments(UUID userId, String userEmail) {
        UUID validUserId = enrollmentService.getValidUserId(userId, userEmail);
        return paymentRepository.findByUserId(validUserId);
    }
}
