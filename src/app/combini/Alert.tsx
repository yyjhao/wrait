import * as React from "react"
import styles from './Alert.module.css'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const alertClass = `${styles.alert} ${styles[variant]} ${className ?? ""}`;
    
    return (
      <div
        ref={ref}
        role="alert"
        className={alertClass}
        {...props}
      />
    );
  }
);

Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h5
    ref={ref}
    className={`${styles.alertTitle} ${className ?? ""}`}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`${styles.alertDescription} ${className ?? ""}`}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
