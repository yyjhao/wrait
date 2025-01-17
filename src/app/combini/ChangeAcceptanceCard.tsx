"use client";

import * as React from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { Row, Column } from "./Flex";
import styles from "./ChangeAcceptanceCard.module.css";

interface ChangeAcceptanceCardProps {
  changeText?: string;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ChangeAcceptanceCard: React.FC<ChangeAcceptanceCardProps> = ({
  changeText,
  onAccept,
  onReject,
  className,
  style,
}) => {
  return (
    <Card className={`${styles.card} ${className || ""}`} style={style}>
      <CardContent>
        <Column gap="lg">
          {changeText && <div className={styles.changeText}>{changeText}</div>}
          <Row justify="between" gap="md">
            <Button
              variant="primary"
              onClick={onAccept}
              className={styles.acceptButton}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              className={styles.rejectButton}
            >
              Reject
            </Button>
          </Row>
        </Column>
      </CardContent>
    </Card>
  );
};
