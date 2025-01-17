"use client";

import { useEffect, useState } from "react";
import { Progress } from "./Progress";
import styles from "./LoadingAIProgressBar.module.css";
import { CheckCircle2, AlertCircle } from "lucide-react";

const defaultMessages = [
  "Summoning the AI magic...",
  "Hold tight, AI is brewing...",
  "Almost there, AI is waking up...",
  "Channeling ancient algorithms...",
  "Consulting the digital oracle...",
];

interface LoadingAIProgressBarProps {
  progress: number;
  className?: string;
  messages?: string[];
  completedMessage?: string;
  errorMessage?: string;
}

export const LoadingAIProgressBar = ({
  progress,
  className = "",
  messages = defaultMessages,
  completedMessage = "AI is ready!",
  errorMessage,
}: LoadingAIProgressBarProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const isCompleted = progress >= 100;

  useEffect(() => {
    if (isCompleted || errorMessage) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length, isCompleted, errorMessage]);

  return (
    <div
      className={`${styles.container} ${isCompleted ? styles.completed : ""} ${errorMessage ? styles.error : ""} ${className}`}
    >
      <div className={styles.progressContainer}>
        {!isCompleted && !errorMessage && (
          <>
            <div className={styles.runeLeft} />
            <Progress value={progress} className={`${styles.progress}`} />
            <div className={styles.runeRight} />
          </>
        )}
        <div
          className={`${styles.messageContainer} ${isCompleted || errorMessage ? styles.completedMessage : ""}`}
        >
          {errorMessage ? (
            <div className={styles.errorContent}>
              <AlertCircle className={styles.errorIcon} />
              <p className={styles.message}>{errorMessage}</p>
            </div>
          ) : isCompleted ? (
            <div className={styles.completedContent}>
              <CheckCircle2 className={styles.completedIcon} />
              <p className={styles.message}>{completedMessage}</p>
            </div>
          ) : (
            <p className={styles.message}>{messages[currentMessageIndex]}</p>
          )}
        </div>
      </div>
    </div>
  );
};
