import React, { forwardRef, TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  disableResize?: boolean;
  variant?: "default" | "clear";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, disableResize = false, variant = "default", ...props },
    ref
  ) => {
    const resizeClass = disableResize ? styles.noResize : "";

    return (
      <textarea
        ref={ref}
        className={`${styles.textarea} ${resizeClass} ${styles[variant]} ${className || ""}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
