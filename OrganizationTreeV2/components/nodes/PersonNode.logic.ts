import {
  OrganizationPerson,
  SurveyResponse,
  SelectedSurvey,
} from "../../types/OrganizationTypes";
import { OrganizationService } from "../../services/data/OrganizationService";

/**
 * Determines if survey button should be shown for a person
 */
export const shouldShowSurveyButton = (
  person: OrganizationPerson,
  fullHierarchy: OrganizationPerson[],
  userId?: string,
  allPeople?: OrganizationPerson[],
  showSurveyButton?: boolean,
): boolean => {
  return (
    showSurveyButton ??
    OrganizationService.isPersonInCurrentUserTeam(
      fullHierarchy,
      person.id,
      userId,
      allPeople,
    )
  );
};

/**
 * Determines if person has survey response
 */
export const hasResponse = (surveyResponse?: SurveyResponse): boolean => {
  return Boolean(surveyResponse?.responseId ?? surveyResponse?.responseUrl);
};

/**
 * Gets survey button configuration
 */
export const getSurveyButtonConfig = (hasResponse: boolean) => {
  if (hasResponse) {
    return {
      appearance: "secondary" as const,
      text: "Wyświetl odpowiedzi",
      icon: "DocumentSearch20Regular" as const,
    };
  } else {
    return {
      appearance: "primary" as const,
      text: "Otwórz ankietę",
      icon: "QuestionCircle20Regular" as const,
    };
  }
};

/**
 * Creates survey click handler
 */
export const createSurveyClickHandler = (
  person: OrganizationPerson,
  onSurveyClick: (personId: string) => void,
) => {
  return (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    onSurveyClick(person.id);
  };
};

/**
 * Creates response click handler
 */
export const createResponseClickHandler = (
  person: OrganizationPerson,
  surveyResponse: SurveyResponse | undefined,
  onResponseClick?: (responseId: string) => void,
) => {
  return (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();

    console.log("PersonNode: Response button clicked", {
      personName: person.name,
      personId: person.id,
      responseId: surveyResponse?.responseId,
      responseUrl: surveyResponse?.responseUrl,
      hasOnResponseClick: !!onResponseClick,
      surveyResponse: surveyResponse,
    });

    // Priority: use responseId with navigateTo modal if available
    if (surveyResponse?.responseId && onResponseClick) {
      console.log(
        "PersonNode: Using Xrm.Navigation.navigateTo modal with responseId:",
        surveyResponse.responseId,
      );
      try {
        onResponseClick(surveyResponse.responseId);
      } catch (error) {
        console.error("PersonNode: Error calling onResponseClick:", error);
        // Fallback to URL if responseId fails
        if (surveyResponse?.responseUrl) {
          console.log("PersonNode: Falling back to responseUrl after error");
          window.open(
            surveyResponse.responseUrl,
            "_blank",
            "noopener,noreferrer",
          );
        }
      }
    }
    // Fallback: use responseUrl with window.open
    else if (surveyResponse?.responseUrl) {
      console.log(
        "PersonNode: Using fallback window.open with responseUrl:",
        surveyResponse.responseUrl,
      );
      window.open(surveyResponse.responseUrl, "_blank", "noopener,noreferrer");
    }
    // Error case: no response data available
    else {
      console.error("PersonNode: No response data available", {
        responseId: surveyResponse?.responseId,
        responseUrl: surveyResponse?.responseUrl,
        hasOnResponseClick: !!onResponseClick,
      });
    }
  };
};

/**
 * Gets survey indicator configuration
 */
export const getSurveyIndicatorConfig = (hasResponse: boolean) => {
  return {
    className: hasResponse ? "responded" : "notResponded",
    style: {
      backgroundColor: hasResponse ? "#10B981" : "#EF4444",
    },
    title: hasResponse
      ? "Użytkownik odpowiedział na ankietę"
      : "Użytkownik nie odpowiedział na ankietę",
    glowColor: hasResponse ? "#10B981" : "#EF4444",
  };
};
