/**
 * You can generally use the other components directly, but this component in partuclar is meant as a demo.
 * Copy the code here and add more business logic for your project.
 */
import React, { useState } from "react";
import { Column } from "./Flex";
import { Card } from "./Card";
import { LoadingAIProgressBar } from "./LoadingAIProgressBar";
import { TextEditor } from "./TextEditor";
import styles from "./Main.module.css";
import { Footer } from "./Footer";

export const Main = ({ className }: { className?: string }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <Column className={styles.container} gap="xs">
      <LoadingAIProgressBar
        progress={loadingProgress}
        className={styles.progressBar}
        errorMessage={error}
      />
      <TextEditor
        hasLoadedAI={loadingProgress === 100}
        onProgress={(n) => setLoadingProgress(n * 100)}
        onLoadError={(e) => setError(e)}
        onHasLoadedAI={() => {
          setLoadingProgress(100);
        }}
      />
      <Footer className={styles.footer} />
    </Column>
  );
};
