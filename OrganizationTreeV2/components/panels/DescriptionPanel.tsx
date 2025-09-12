import * as React from "react";
import { Text, tokens } from "@fluentui/react-components";
import { TextDescription20Regular } from "@fluentui/react-icons";
import { SelectedSurvey } from "../../types/OrganizationTypes";
import { useOrganizationTreeStyles } from "../core/OrganizationTree.styles";
import { FIXED_HEIGHT } from "../../services/utils/constants";

export interface DescriptionPanelProps {
  selectedSurvey: SelectedSurvey | null;
  width: number;
}

/**
 * Panel component for displaying survey description
 */
export const DescriptionPanel: React.FC<DescriptionPanelProps> = ({
  selectedSurvey,
  width,
}) => {
  const styles = useOrganizationTreeStyles();

  return (
    <div
      className={styles.descriptionPanel}
      style={{
        width: `${width}px`,
        height: `${FIXED_HEIGHT}px`,
      }}
    >
      <div className={styles.descriptionPanelHeader}>
        <TextDescription20Regular />
        <Text weight="semibold">Opis ankiety</Text>
      </div>
      <div className={styles.descriptionContent}>
        {selectedSurvey?.description ? (
          <Text weight="bold">{selectedSurvey.description}</Text>
        ) : (
          <Text style={{ color: tokens.colorNeutralForeground3 }}>
            Brak opisu dla wybranej ankiety
          </Text>
        )}
      </div>
    </div>
  );
};
