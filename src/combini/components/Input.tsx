import React, { forwardRef, InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${styles.input} ${className || ""}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
