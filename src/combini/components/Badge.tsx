import styles from './Badge.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export const Badge = ({
  variant = 'default',
  className,
  children,
  ...props
}: Props) => {
  return (
    <div
      className={`${styles.badge} ${styles[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
