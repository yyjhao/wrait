import React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import styles from "./Separator.module.css";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
  decorative?: boolean;
}

export const Separator = ({
  orientation = "horizontal",
  className = "",
  decorative = true,
}: SeparatorProps) => {
  return (
    <SeparatorPrimitive.Root
      className={`${styles.separator} ${styles[orientation]} ${className ?? ""}`}
      orientation={orientation}
      decorative={decorative}
    />
  );
};
