import React from 'react';

const Button = ({ onClick, label, className }) => {
  return (
    <button className={`btn ${className}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default Button;