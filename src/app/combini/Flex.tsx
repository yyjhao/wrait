import React from 'react';
import styles from './Flex.module.css';
import { Slot } from '@radix-ui/react-slot';

interface FlexBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'stretch';
  padding?: boolean;
  className?: string;
  asChild?: boolean;
}

export const Row: React.FC<FlexBaseProps> = ({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  padding = false,
  className = '',
  asChild = false,
  ...props
}) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      className={`
        ${styles.row} 
        ${styles[`gap-${gap}`]} 
        ${styles[`align-${align}`]} 
        ${styles[`justify-${justify}`]} 
        ${padding ? styles.rowPadding : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </Comp>
  );
};

export const Column: React.FC<FlexBaseProps> = ({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  padding = false,
  className = '',
  asChild = false,
  ...props
}) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      className={`
        ${styles.column} 
        ${styles[`gap-${gap}`]} 
        ${styles[`align-${align}`]} 
        ${styles[`justify-${justify}`]} 
        ${padding ? styles.columnPadding : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </Comp>
  );
};