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
import {
  OrganizationPerson,
  SurveyResponse,
  SelectedSurvey,
  UserContext,
  SurveyAccessResult,
  Survey,
} from "../types/OrganizationTypes";
import { OrganizationService } from "../services/OrganizationService";
import { SurveyAccessService } from "../services/SurveyAccessService";
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
    // Nowe pola dla systemu uprawnień
    userContext?: UserContext;
    // Nowe pola dla logiki łańcuchowej
    allSurveyResponses?: SurveyResponse[];
    surveys?: Survey[];
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
    userContext,
    allSurveyResponses,
    surveys,
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

  // Sprawdź czy istnieje odpowiedź dla tej osoby - priorytet responseId, fallback responseUrl
  const hasResponse = !!(surveyResponse?.responseId ?? surveyResponse?.responseUrl);

  // ============================================
  // NOWY SYSTEM UPRAWNIEŃ OPARTY NA RELACJI MANAGER-PODWŁADNY
  // Z OBSŁUGĄ ŁAŃCUCHOWĄ ETAPÓW (CHAINED SURVEYS)
  // ============================================

  // Wykryj etap ankiety na podstawie nazwy
  const surveyStage = selectedSurvey
    ? SurveyAccessService.detectSurveyStage(selectedSurvey.name)
    : null;

  // Oblicz poziom dostępu używając nowego serwisu uprawnień
  const accessResult: SurveyAccessResult = React.useMemo(() => {
    if (!userContext || !selectedSurvey) {
      // Fallback do starego zachowania jeśli brak kontekstu użytkownika
      const fallbackHasAccess = showSurveyButton ?? OrganizationService.isPersonInCurrentUserTeam(
        fullHierarchy,
        person.id,
        userId,
        allPeople
      );
      return {
        accessLevel: fallbackHasAccess ? (hasResponse ? "view" : "edit") : "none",
        reason: fallbackHasAccess
          ? (hasResponse ? "Kliknij aby wyświetlić odpowiedzi" : "Kliknij aby otworzyć ankietę")
          : "Brak uprawnień",
      } as SurveyAccessResult;
    }

    return SurveyAccessService.getSurveyAccessLevel(
      surveyStage,
      person.id,
      userContext,
      hasResponse,
      allSurveyResponses,
      surveys,
      person.email
    );
  }, [userContext, selectedSurvey, surveyStage, person.id, person.email, hasResponse, showSurveyButton, fullHierarchy, userId, allPeople, allSurveyResponses, surveys]);

  // Określ czy pokazać przycisk ankiety
  // Pokaż przycisk jeśli mamy dostęp LUB jeśli jest zablokowany przez logikę łańcuchową
  const shouldShowSurveyButton = accessResult.accessLevel !== "none" || accessResult.isChainBlocked === true;

  // Określ czy przycisk jest w trybie tylko do odczytu
  const isReadOnly = accessResult.accessLevel === "view";

  // Określ czy przycisk jest zablokowany przez logikę łańcuchową
  const isChainBlocked = accessResult.isChainBlocked === true;

  // Sprawdź czy pokazać wskazówkę ankiety (tylko dla widocznych przycisków z dostępem)
  const shouldShowSurveyIndicator = accessResult.accessLevel !== "none";

  // Tooltip wyjaśniający stan przycisku
  const surveyButtonTooltip = accessResult.disabledReason ?? accessResult.reason;

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
              {isChainBlocked ? (
                // Przycisk zablokowany przez logikę łańcuchową - disabled z tooltipem
                <Button
                  className={styles.surveyButton}
                  appearance="secondary"
                  size="small"
                  icon={<QuestionCircle20Regular />}
                  disabled={true}
                  title={surveyButtonTooltip}
                >
                  Otwórz ankietę
                </Button>
              ) : isReadOnly || hasResponse ? (
                // Tryb podglądu (read-only) - użytkownik może tylko przeglądać
                <Button
                  className={styles.surveyButton}
                  appearance="secondary"
                  size="small"
                  icon={<DocumentSearch20Regular />}
                  onClick={handleResponseClick}
                  disabled={!hasResponse}
                  title={surveyButtonTooltip}
                >
                  {hasResponse ? "Wyświetl odpowiedzi" : "Brak odpowiedzi"}
                </Button>
              ) : (
                // Tryb edycji - użytkownik może wypełnić ankietę
                <Button
                  className={styles.surveyButton}
                  appearance="primary"
                  size="small"
                  icon={<QuestionCircle20Regular />}
                  onClick={handleSurveyClick}
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
