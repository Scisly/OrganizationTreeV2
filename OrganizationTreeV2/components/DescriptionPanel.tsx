import * as React from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
} from "@fluentui/react-components";
import { TextDescription20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  panel: {
    minWidth: "200px",
    height: "100%",
    overflow: "auto",
    ...shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    ...shorthands.padding("12px"),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  content: {
    flex: "1 1 auto",
    ...shorthands.padding("12px"),
    ...shorthands.overflow("auto"),
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
  },
});

export interface DescriptionPanelProps {
  description: string | undefined;
  width: number;
  height: number;
}

/**
 * Panel component for displaying survey description
 */
export const DescriptionPanel: React.FC<DescriptionPanelProps> = ({
  description,
  width,
  height,
}) => {
  const styles = useStyles();

  return (
    <div
      className={styles.panel}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className={styles.header}>
        <TextDescription20Regular />
        <Text weight="semibold">Opis ankiety</Text>
      </div>
      <div className={styles.content}>
        {description ? (
          <Text weight="bold">{description}</Text>
        ) : (
          <Text className={styles.emptyText}>
            Brak opisu dla wybranej ankiety
          </Text>
        )}
      </div>
    </div>
  );
};
