"use client";

import React from "react";
import { Row } from "./Flex";
import styles from "./EditorToolbar.module.css";

interface EditorToolbarProps {
  className?: string;
  children: React.ReactNode;
}

export const EditorToolbar = ({
  children,
  className,
}: EditorToolbarProps) => {
  return (
    <div className={`${styles.toolbar} ${className || ""}`}>
      <Row gap="sm" className={styles.buttonContainer} justify="center">
        {children}
      </Row>
    </div>
  );
};