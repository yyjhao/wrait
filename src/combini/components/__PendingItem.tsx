import React from 'react';
import styles from './__PendingItem.module.css';

interface PendingItemProps extends React.HTMLAttributes<HTMLDivElement> {
name: string;
}

export const PendingItem: React.FC<PendingItemProps> = ({ 
name, 
className = '', 
...props 
}) => {
return (
<div 
  className={`${styles.pendingItem} ${className}`} 
  {...props}
>
  &lt;{name}&gt;
</div>
);
};