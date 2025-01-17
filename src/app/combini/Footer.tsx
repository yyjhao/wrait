import React from "react";
import { Row } from "./Flex";
import { Twitter, Github } from "lucide-react";
import styles from "./Footer.module.css";

export const Footer = ({ className }: { className?: string }) => {
  return (
    <footer className={`${styles.footer} ${className || ""}`}>
      <Row className={styles.content} justify="center" align="center" gap="sm">
        <span className={styles.text}>Built with</span>
        <Row className={styles.links} gap="xs">
          <a
            href="https://github.com/mozilla/llama"
            target="_blank"
            className={styles.link}
          >
            LLAMA
          </a>
          <span className={styles.separator}>•</span>
          <a
            href="https://webllm.mlc.ai/"
            target="_blank"
            className={styles.link}
          >
            webllm
          </a>
          <span className={styles.separator}>•</span>
          <a
            href="https://prosemirror.net/"
            target="_blank"
            className={styles.link}
          >
            ProseMirror
          </a>
          <span className={styles.separator}>•</span>
          <a href="https://combini.dev" target="_blank" className={styles.link}>
            Combini
          </a>
        </Row>
        <div className={styles.divider} />
        <Row className={styles.socialLinks} gap="sm">
          <a
            href="https://x.com/yyjhao"
            target="_blank"
            className={styles.socialLink}
            aria-label="Twitter"
          >
            <Twitter size={16} />
          </a>
          <a
            href="https://github.com/yyjhao/wrait"
            target="_blank"
            className={styles.socialLink}
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
        </Row>
      </Row>
    </footer>
  );
};
