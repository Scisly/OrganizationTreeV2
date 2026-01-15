import * as React from "react";
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
  shorthands,
  tokens,
  Text,
  Spinner,
} from "@fluentui/react-components";
import { Organization20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
  },
  stateWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground3,
  },
  text: {
    color: tokens.colorNeutralForeground2,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
});

export interface LoadingStateProps {
  width: number;
  height: number;
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  loadingMessage?: string;
  emptyMessage?: string;
}

/**
 * Component for rendering loading, empty, and error states
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  width,
  height,
  isLoading,
  isEmpty,
  error,
  loadingMessage = "Ładowanie danych organizacyjnych...",
  emptyMessage = "Brak danych organizacyjnych do wyświetlenia",
}) => {
  const styles = useStyles();

  // Error state
  if (error) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          className={styles.container}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <div className={styles.stateWrapper}>
            <Organization20Regular className={styles.icon} />
            <Text className={styles.errorText}>{error}</Text>
          </div>
        </div>
      </FluentProvider>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          className={styles.container}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <div className={styles.stateWrapper}>
            <Spinner size="medium" label={loadingMessage} />
          </div>
        </div>
      </FluentProvider>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          className={styles.container}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <div className={styles.stateWrapper}>
            <Organization20Regular className={styles.icon} />
            <Text className={styles.text}>{emptyMessage}</Text>
          </div>
        </div>
      </FluentProvider>
    );
  }

  // No state to render - return null so parent can render content
  return null;
};
