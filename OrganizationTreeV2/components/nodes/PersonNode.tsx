import * as React from "react";
import { Handle, Position } from "reactflow";
import {
  Card,
  CardHeader,
  Button,
  Text,
  mergeClasses,
} from "@fluentui/react-components";
import {
  PersonCircle20Regular,
  QuestionCircle20Regular,
  DocumentSearch20Regular,
} from "@fluentui/react-icons";
import {
  OrganizationPerson,
  SurveyResponse,
  SelectedSurvey,
} from "../../types/OrganizationTypes";
import { Glow, GlowCapture } from "@codaworks/react-glow";
import { usePersonNodeStyles } from "./PersonNode.styles";
import {
  shouldShowSurveyButton,
  hasResponse,
  createSurveyClickHandler,
  createResponseClickHandler,
  getSurveyIndicatorConfig,
} from "./PersonNode.logic";

export interface PersonNodeProps {
  data: {
    person: OrganizationPerson;
    selectedSurvey?: SelectedSurvey;
    onSurveyClick: (personId: string) => void;
    onResponseClick?: (responseId: string) => void;
    surveyResponse?: SurveyResponse;
    userId?: string;
    fullHierarchy: OrganizationPerson[];
    allPeople?: OrganizationPerson[];
    showSurveyButton?: boolean;
  };
}

const PersonNodeComponent: React.FC<PersonNodeProps> = ({ data }) => {
  const styles = usePersonNodeStyles();
  const {
    person,
    selectedSurvey,
    onSurveyClick,
    onResponseClick,
    surveyResponse,
    userId,
    fullHierarchy,
    allPeople,
    showSurveyButton,
  } = data;

  const handleSurveyClick = createSurveyClickHandler(person, onSurveyClick);

  const handleResponseClick = createResponseClickHandler(
    person,
    surveyResponse,
    onResponseClick,
  );

  // Check if survey button should be shown
  const shouldShowButton = shouldShowSurveyButton(
    person,
    fullHierarchy,
    userId,
    allPeople,
    showSurveyButton,
  );

  // Check if response exists for this person - priority responseId, fallback responseUrl
  const hasResponseData = hasResponse(surveyResponse);

  // Check if survey indicator should be shown (only for current user's team)
  const shouldShowSurveyIndicator = shouldShowButton;

  // Get indicator configuration
  const indicatorConfig = getSurveyIndicatorConfig(hasResponseData);

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
        isConnectable={false}
      />

      <Card className={styles.card}>
        <GlowCapture>
          <CardHeader
            className={styles.cardHeader}
            image={
              shouldShowSurveyIndicator ? (
                <div className={styles.glowWrapper}>
                  <Glow color={indicatorConfig.glowColor}>
                    <div
                      className={mergeClasses(
                        styles.surveyIndicator,
                        indicatorConfig.className
                      )}
                      title={indicatorConfig.title}
                      style={{
                        "--survey-indicator-bg": indicatorConfig.style.backgroundColor,
                      } as React.CSSProperties}
                    />
                  </Glow>
                </div>
              ) : (
                <PersonCircle20Regular />
              )
            }
            header={
              <div className={styles.headerContent}>
                <Text className={styles.personName}>{person.name}</Text>
              </div>
            }
          />
        </GlowCapture>

        <div className={styles.cardContent}>
          {person.position && (
            <Text className={styles.position}>{person.position}</Text>
          )}
          {person.email && <Text className={styles.email}>{person.email}</Text>}

          {shouldShowButton && (
            <>
              {hasResponseData ? (
                <Button
                  className={styles.surveyButton}
                  appearance="secondary"
                  size="small"
                  icon={<DocumentSearch20Regular />}
                  onClick={handleResponseClick}
                >
                  Wyświetl odpowiedzi
                </Button>
              ) : (
                <Button
                  className={styles.surveyButton}
                  appearance="primary"
                  size="small"
                  icon={<QuestionCircle20Regular />}
                  onClick={handleSurveyClick}
                >
                  Otwórz ankietę
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        isConnectable={false}
      />
    </>
  );
};

PersonNodeComponent.displayName = "PersonNode";

export const PersonNode = React.memo(PersonNodeComponent);
