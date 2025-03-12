import React from 'react';

const Input = ({ value, onChange, type, placeholder, className }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input ${className}`}
    />
  );
};

export default Input;

/* 

Usage :

const [inputValue, setInputValue] = React.useState("");

<Input
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  type="text"
  placeholder="Enter something..."
  className="input-primary"
/> */