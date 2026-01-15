import * as React from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  CardHeader,
  Badge,
} from "@fluentui/react-components";
import { Poll20Regular, Checkmark16Regular } from "@fluentui/react-icons";
import { Survey, SelectedSurvey, SurveyNotificationMap } from "../types/OrganizationTypes";

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
  list: {
    flex: "1 1 auto",
    ...shorthands.padding("8px"),
    ...shorthands.overflow("auto"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
  },
  item: {
    ...shorthands.padding("8px"),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  itemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border("1px", "solid", tokens.colorBrandStroke1),
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  cardHeader: {
    position: "relative",
  },
  selectedIcon: {
    color: tokens.colorBrandForeground1,
  },
  headerWithIcon: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  surveyNameContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    ...shorthands.gap("8px"),
  },
  badge: {
    marginLeft: "auto",
  },
});

export interface SurveyPanelProps {
  surveys: Survey[];
  selectedSurvey: SelectedSurvey | null;
  onSurveySelect: (survey: Survey) => void;
  width: number;
  height: number;
  notificationCounts?: SurveyNotificationMap;
}

/**
 * Panel component for displaying and selecting surveys
 */
export const SurveyPanel: React.FC<SurveyPanelProps> = ({
  surveys,
  selectedSurvey,
  onSurveySelect,
  width,
  height,
  notificationCounts,
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
        <Poll20Regular />
        <Text weight="semibold">Ankiety ({surveys.length})</Text>
      </div>
      <div className={styles.list}>
        {surveys.length === 0 ? (
          <Text>Brak dostępnych ankiet</Text>
        ) : (
          surveys.map((survey) => {
            const isSelected = selectedSurvey?.id === survey.msfp_surveyid;
            const notificationCount = notificationCounts?.get(survey.msfp_surveyid) ?? 0;
            return (
              <Card
                key={survey.msfp_surveyid}
                className={`${styles.item} ${
                  isSelected ? styles.itemSelected : ""
                }`}
                onClick={() => onSurveySelect(survey)}
                appearance="subtle"
              >
                <div className={styles.cardHeader}>
                  <CardHeader
                    header={
                      <div className={styles.headerWithIcon}>
                        {isSelected && (
                          <Checkmark16Regular className={styles.selectedIcon} />
                        )}
                        <div className={styles.surveyNameContainer}>
                          <Text weight={isSelected ? "bold" : "medium"}>
                            {survey.msfp_name}
                          </Text>
                          {notificationCount > 0 && (
                            <Badge
                              appearance="filled"
                              color="danger"
                              size="small"
                              className={styles.badge}
                              title={`${notificationCount} zadań do wykonania`}
                            >
                              {notificationCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    }
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
