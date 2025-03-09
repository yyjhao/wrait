"use client";

import React from "react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./EditorButton.module.css";

interface EditorButtonProps {
  action: () => void;
  label: string;
  shortcut: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const EditorButton = ({
  action,
  label,
  shortcut,
  className,
  disabled = false,
  loading = false,
}: EditorButtonProps) => {
  // Function to format the shortcut based on OS
  const formatShortcut = (shortcut: string) => {
    const isMac = typeof window !== 'undefined' && 
      navigator.platform.toLowerCase().includes('mac');
    
    return shortcut.replace(/mod/gi, isMac ? '⌘' : 'Ctrl');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={action}
      className={`${styles.editorButton} ${className || ""}`}
      disabled={disabled || loading}
    >
      {loading ? (
        <Spinner size="sm" className={styles.spinner} />
      ) : (
        <>
          <span>{label}</span>
          <kbd className={styles.shortcut}>{formatShortcut(shortcut)}</kbd>
        </>
      )}
    </Button>
  );
};