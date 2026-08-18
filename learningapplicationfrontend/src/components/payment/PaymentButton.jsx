import React from 'react';
import Button from '../common/Button';

const PaymentButton = ({ amount, onPay }) => {
  return (
    <Button onClick={onPay} variant="primary" className="w-full">
      🔒 Pay ${amount} with Razorpay
    </Button>
  );
};

export default PaymentButton;
