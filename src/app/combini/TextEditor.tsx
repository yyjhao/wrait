"use client";

import React from "react";
import styles from "./TextEditor.module.css";

interface TextEditorProps {
  className?: string;
  editorRef: React.RefObject<HTMLDivElement>;
  onMouseOver?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

export const TextEditor = ({
  className = "",
  editorRef,
  children,
  onMouseOver,
}: TextEditorProps) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div
        ref={editorRef}
        className={styles.editor}
        onMouseOver={onMouseOver}
      />
      {children}
    </div>
  );
};
