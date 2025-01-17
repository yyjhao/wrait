/**
 * You can generally use the other components directly, but this component in partuclar is meant as a demo.
 * Copy the code here and add more business logic for your project.
 */
import React, { useState } from "react";
import { Column } from "./Flex";
import { Card } from "./Card";
import { LoadingAIProgressBar } from "./LoadingAIProgressBar";
import styles from "./Main.module.css";

export const Main = ({ className }: { className?: string }) => {
  const [progress] = useState(65); // For demo purposes, you can make this dynamic

  return (
    <Column className={`${styles.container} ${className || ""}`} gap="xs">
      <div className={styles.poweredBy}>
        {" "}
        Built with{" "}
        <a href="https://ai.meta.com/blog/meta-llama-3-1/" target="_blank">
          LLAMA
        </a>{" "}
        and{" "}
        <a href="https://webllm.mlc.ai" target="_blank">
          webllm
        </a>
      </div>
      <LoadingAIProgressBar
        progress={progress}
        className={styles.progressBar}
      />
      <Card className={styles.content}></Card>
    </Column>
  );
};
