"use client";

import { useState } from "react";
import { Column } from "./combini/Flex";
import styles from "./combini/Main.module.css";
import { LoadingAIProgressBar } from "./combini/LoadingAIProgressBar";
import { TextEditorWrapper } from "./components/TextEditorWrapper";
import { Footer } from "./combini/Footer";

if (typeof navigator === "undefined") {
  global.navigator = {
    userAgent: "nodejs",
    platform: "nodejs",
  } as Navigator;
}

export default function Home() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <Column className={styles.container} gap="xs">
      <LoadingAIProgressBar
        progress={loadingProgress}
        className={styles.progressBar}
        errorMessage={error}
      />
      <TextEditorWrapper
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
}
