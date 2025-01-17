import React, { forwardRef, LabelHTMLAttributes } from "react";
import styles from "./Label.module.css";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children?: React.ReactNode;
}

export const Label = forwardRef<React.ElementRef<"label">, LabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`${styles.label} ${className || ""}`}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = "Label";
