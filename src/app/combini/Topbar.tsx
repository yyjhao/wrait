import { ReactNode } from "react";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  /** Content to be rendered on the left side */
  leftContent?: ReactNode;
  /** Content to be rendered on the right side */
  rightContent?: ReactNode;
  className?: string;
}

export const Topbar = ({ leftContent, rightContent, className }: TopbarProps) => {
  return (
    <div className={`${styles.topbar} ${className || ""}`}>
      <div className={styles.leftSection}>{leftContent}</div>
      <div className={styles.rightSection}>{rightContent}</div>
    </div>
  );
};
