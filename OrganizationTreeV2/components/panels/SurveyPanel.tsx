import * as React from "react";
import { Text, Card, CardHeader, mergeClasses } from "@fluentui/react-components";
import { Poll20Regular, Checkmark16Regular } from "@fluentui/react-icons";
import { Survey, SelectedSurvey } from "../../types/OrganizationTypes";
import { useOrganizationTreeStyles } from "../core/OrganizationTree.styles";
import { FIXED_HEIGHT } from "../../services/utils/constants";

export interface SurveyPanelProps {
  surveys: Survey[];
  selectedSurvey: SelectedSurvey | null;
  onSurveySelect: (survey: Survey) => void;
  width: number;
}

/**
 * Panel component for displaying and selecting surveys
 */
export const SurveyPanel: React.FC<SurveyPanelProps> = ({
  surveys,
  selectedSurvey,
  onSurveySelect,
  width,
}) => {
  const styles = useOrganizationTreeStyles();

  return (
    <div
      className={styles.surveyPanel}
      style={{
        width: `${width}px`,
        height: `${FIXED_HEIGHT}px`,
      }}
    >
      <div className={styles.surveyPanelHeader}>
        <Poll20Regular />
        <Text weight="semibold">Ankiety ({surveys.length})</Text>
      </div>
      <div className={styles.surveyList}>
        {surveys.length === 0 ? (
          <Text>Brak dostępnych ankiet</Text>
        ) : (
          surveys.map((survey) => {
            const isSelected = selectedSurvey?.id === survey.msfp_surveyid;
            return (
              <Card
                key={survey.msfp_surveyid}
                className={mergeClasses(
                  styles.surveyItem,
                  isSelected && styles.surveyItemSelected
                )}
                onClick={() => onSurveySelect(survey)}
                appearance="subtle"
              >
                <div className={styles.surveyCardHeader}>
                  <CardHeader
                    header={
                      <div className={styles.surveyHeaderWithIcon}>
                        {isSelected && (
                          <Checkmark16Regular className={styles.selectedSurveyIcon} />
                        )}
                        <Text weight={isSelected ? "bold" : "medium"}>
                          {survey.msfp_name}
                        </Text>
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
