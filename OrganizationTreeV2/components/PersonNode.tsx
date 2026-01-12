import * as React from "react";
import { Handle, Position } from "reactflow";
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  PersonCircle20Regular,
  QuestionCircle20Regular,
  DocumentSearch20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
} from "@fluentui/react-icons";
import { OrganizationPerson, SurveyResponse, SelectedSurvey } from "../types/OrganizationTypes";
import { OrganizationService } from "../services/OrganizationService";
import { Glow, GlowCapture } from "@codaworks/react-glow";

const useStyles = makeStyles({
  card: {
    width: "253px", // Zwiększone o 15% (220 * 1.15) dla lepszej czytelności
    minHeight: "138px", // Proporcjonalnie zwiększone (120 * 1.15)
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow8,
    position: "relative",
    "&:hover": {
      boxShadow: tokens.shadow16,
    },
  },
  surveyIndicator: {
    width: "20px !important",
    height: "20px !important",
    borderRadius: "50% !important",
    marginLeft: "0px",
    flexShrink: 0,
    position: "relative",
    display: "block !important",
    border: "none !important",
    outline: "none !important",
    overflow: "visible !important",
    minWidth: "20px !important",
    minHeight: "20px !important",
    maxWidth: "20px !important",
    maxHeight: "20px !important",
    borderTopLeftRadius: "50% !important",
    borderTopRightRadius: "50% !important",
    borderBottomLeftRadius: "50% !important",
    borderBottomRightRadius: "50% !important",
    "&.responded": {
      backgroundColor: "#10B981 !important", // Emerald-500
    },
    "&.notResponded": {
      backgroundColor: "#EF4444 !important", // Red-500
    },
    "&::before": {
      display: "none !important",
    },
    "&::after": {
      display: "none !important",
    },
  },
  glowWrapper: {
    borderRadius: "50% !important",
    overflow: "visible !important",
    display: "inline-block",
  },
  cardHeader: {
    ...shorthands.padding("8px", "12px"),
    display: "flex",
    alignItems: "center",
    "& .fui-CardHeader__header": {
      display: "flex",
      alignItems: "center",
      flex: 1,
    },
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  cardContent: {
    ...shorthands.padding("0px", "12px", "12px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
  },
  personName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  position: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  email: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  surveyButton: {
    marginTop: "8px",
    width: "100%",
    pointerEvents: "auto",
    position: "relative",
    zIndex: 10,
  },
  handle: {
    width: "8px",
    height: "8px",
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border("2px", "solid", tokens.colorNeutralBackground1),
  },
  collapseButton: {
    minWidth: "28px",
    height: "28px",
  },
});

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
    onToggleCollapse?: (personId: string) => void;
    isCollapsed?: boolean;
    hasChildren?: boolean;
  };
}

export const PersonNode: React.FC<PersonNodeProps> = ({ data }) => {
  const styles = useStyles();
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
    onToggleCollapse,
    isCollapsed,
    hasChildren,
  } = data;

  const handleSurveyClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    onSurveyClick(person.id);
  };

  const handleResponseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    
    console.log("PersonNode: Response button clicked", {
      personName: person.name,
      personId: person.id,
      responseId: surveyResponse?.responseId,
      responseUrl: surveyResponse?.responseUrl,
      hasOnResponseClick: !!onResponseClick,
      surveyResponse: surveyResponse
    });
    
    // Priority: use responseId with navigateTo modal if available
    if (surveyResponse?.responseId && onResponseClick) {
      console.log("PersonNode: Using Xrm.Navigation.navigateTo modal with responseId:", surveyResponse.responseId);
      try {
        onResponseClick(surveyResponse.responseId);
      } catch (error) {
        console.error("PersonNode: Error calling onResponseClick:", error);
        // Fallback to URL if responseId fails
        if (surveyResponse?.responseUrl) {
          console.log("PersonNode: Falling back to responseUrl after error");
          window.open(surveyResponse.responseUrl, "_blank", "noopener,noreferrer");
        }
      }
    } 
    // Fallback: use responseUrl with window.open
    else if (surveyResponse?.responseUrl) {
      console.log("PersonNode: Using fallback window.open with responseUrl:", surveyResponse.responseUrl);
      window.open(surveyResponse.responseUrl, "_blank", "noopener,noreferrer");
    } 
    // Error case: no response data available
    else {
      console.error("PersonNode: No response data available", {
        responseId: surveyResponse?.responseId,
        responseUrl: surveyResponse?.responseUrl,
        hasOnResponseClick: !!onResponseClick
      });
    }
  };

  const handleToggleCollapse = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();

    if (onToggleCollapse) {
      onToggleCollapse(person.id);
    }
  };

  // Sprawdź czy pokazać przycisk ankiety
  const shouldShowSurveyButton =
    showSurveyButton ??
    OrganizationService.isPersonInCurrentUserTeam(
      fullHierarchy,
      person.id,
      userId,
      allPeople
    );

  // Sprawdź czy istnieje odpowiedź dla tej osoby - priorytet responseId, fallback responseUrl
  const hasResponse = surveyResponse?.responseId ?? surveyResponse?.responseUrl;

  // Sprawdź czy pokazać wskazówkę ankiety (tylko dla zespołu aktualnego użytkownika)
  const shouldShowSurveyIndicator = shouldShowSurveyButton;

  // Sprawdź czy osoba ma podwładnych (jest przełożonym)
  const personHasSubordinates = allPeople
    ? OrganizationService.hasSubordinates(person.id, allPeople)
    : false;

  // Sprawdź czy ankieta wymaga bycia przełożonym (Stage 2 lub Stage 3)
  const isSupervisorOnlySurvey =
    selectedSurvey &&
    (selectedSurvey.name.includes("Stage 2") ||
      selectedSurvey.name.includes("Stage 3"));

  // Wyłącz przycisk ankiety jeśli:
  // - Ankieta to Stage 2/3 AND osoba nie ma podwładnych
  const isSurveyButtonDisabled =
    isSupervisorOnlySurvey && !personHasSubordinates;

  // Tooltip wyjaśniający dlaczego przycisk jest wyłączony
  const surveyButtonTooltip = isSurveyButtonDisabled
    ? "Ankieta dostępna tylko dla przełożonych"
    : hasResponse
    ? "Kliknij aby wyświetlić odpowiedzi"
    : "Kliknij aby otworzyć ankietę";

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
                  <Glow color={hasResponse ? "#10B981" : "#EF4444"}>
                    <div
                      className={`${styles.surveyIndicator} ${
                        hasResponse ? "responded" : "notResponded"
                      }`}
                      title={
                        hasResponse
                          ? "Użytkownik odpowiedział na ankietę"
                          : "Użytkownik nie odpowiedział na ankietę"
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: hasResponse ? "#10B981" : "#EF4444",
                        border: "none",
                        display: "block",
                        flexShrink: 0,
                        boxSizing: "border-box",
                        WebkitBorderRadius: "50%",
                        MozBorderRadius: "50%",
                        appearance: "none",
                        WebkitAppearance: "none",
                      }}
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
                {hasChildren && (
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.collapseButton}
                    icon={
                      isCollapsed ? (
                        <ChevronRight20Regular />
                      ) : (
                        <ChevronDown20Regular />
                      )
                    }
                    onClick={handleToggleCollapse}
                    aria-label={
                      isCollapsed
                        ? "Rozwiń podwładnych"
                        : "Zwiń podwładnych"
                    }
                  />
                )}
              </div>
            }
          />
        </GlowCapture>

        <div className={styles.cardContent}>
          {person.position && (
            <Text className={styles.position}>{person.position}</Text>
          )}
          {person.email && <Text className={styles.email}>{person.email}</Text>}

          {shouldShowSurveyButton && (
            <>
              {hasResponse ? (
                <Button
                  className={styles.surveyButton}
                  appearance="secondary"
                  size="small"
                  icon={<DocumentSearch20Regular />}
                  onClick={handleResponseClick}
                  disabled={isSurveyButtonDisabled}
                  title={surveyButtonTooltip}
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
                  disabled={isSurveyButtonDisabled}
                  title={surveyButtonTooltip}
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
