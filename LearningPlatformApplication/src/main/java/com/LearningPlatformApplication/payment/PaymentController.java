package com.LearningPlatformApplication.payment;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<Payment>> initiatePayment(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userEmail,
            @RequestParam UUID courseId,
            @RequestParam(required = false) BigDecimal amount
    ) {
        UUID uid = parseUUID(userId);
        return ResponseEntity.ok(ApiResponse.success("Payment order initiated", paymentService.initiatePayment(uid, userEmail, courseId, amount)));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Payment>> verifyPayment(
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String signature,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) UUID courseId,
            @RequestParam(required = false) BigDecimal amount
    ) {
        UUID uid = parseUUID(userId);
        return ResponseEntity.ok(ApiResponse.success("Payment verified", paymentService.completePayment(razorpayOrderId, razorpayPaymentId, signature, uid, userEmail, courseId, amount)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getUserPayments(
            @PathVariable String userId,
            @RequestParam(required = false) String userEmail
    ) {
        UUID uid = parseUUID(userId);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", paymentService.getUserPayments(uid, userEmail)));
    }

    private UUID parseUUID(String str) {
        if (str == null || str.isBlank() || str.equals("undefined") || str.equals("null")) return null;
        try {
            return UUID.fromString(str);
        } catch (Exception e) {
            return null;
        }
    }
}
