import React from 'react';
import '../../styles/components.css';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '' }) => {
  return (
    <button type={type} onClick={onClick} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
