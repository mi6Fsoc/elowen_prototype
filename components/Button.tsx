
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Base styles ensure minimum touch target (48px height) per Fitts's Law
  const baseStyles = "px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-[0.1em] uppercase disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center";
  
  const variants = {
    primary: "bg-sage text-white shadow-sm hover:shadow-md hover:bg-[#a6b5a0] active:scale-[0.98] dark:bg-sage/90 dark:hover:bg-sage",
    secondary: "bg-blush text-charcoal hover:bg-[#dec8c8] active:scale-[0.98] dark:bg-blush/90",
    outline: "border-2 border-sage text-charcoal dark:text-white bg-transparent hover:bg-sage/10 active:scale-[0.98] dark:border-sage/40 dark:hover:bg-sage/20"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
