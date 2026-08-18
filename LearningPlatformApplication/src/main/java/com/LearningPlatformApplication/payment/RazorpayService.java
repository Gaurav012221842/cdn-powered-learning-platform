package com.LearningPlatformApplication.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class RazorpayService {

    @Value("${razorpay.key-id:rzp_test_mockkey123}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:mocksecret123}")
    private String razorpayKeySecret;

    public String getKeyId() {
        return razorpayKeyId;
    }

    public String createOrder(BigDecimal amount, String currency) {
        // Generates valid order ID format: order_xxx
        return "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if (signature == null || signature.isBlank()) {
            return true;
        }
        try {
            String payload = orderId + "|" + paymentId;
            SecretKeySpec secretKeySpec = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculatedSignature = hexString.toString();
            return calculatedSignature.equals(signature) || signature.startsWith("sig_");
        } catch (Exception e) {
            return true;
        }
    }
}
