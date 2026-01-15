// Types for organization hierarchy
export interface OrganizationPerson {
  id: string;
  name: string;
  position?: string;
  managerId?: string;
  email?: string;
  ag_userid?: string;
  level?: number;
  children?: OrganizationPerson[];
}

export interface OrganizationNode {
  id: string;
  type: "person";
  position: { x: number; y: number };
  data: {
    person: OrganizationPerson;
    selectedSurvey?: SelectedSurvey;
    onSurveyClick: (personId: string) => void;
    onResponseClick?: (responseId: string) => void;
    userId?: string;
    fullHierarchy: OrganizationPerson[];
    allPeople?: OrganizationPerson[];
    showSurveyButton?: boolean;
    surveyResponse?: SurveyResponse;
    onToggleCollapse?: (personId: string) => void;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    userContext?: UserContext;
    allSurveyResponses?: SurveyResponse[];
    surveys?: Survey[];
  };
}

export interface OrganizationEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
}

export interface HierarchyFilterOptions {
  currentUserId?: string;
  showOnlyTeam?: boolean;
}

export interface SurveyResponse {
  responseId: string;
  surveyId: string;
  personId: string;
  responseUrl?: string;
  responseDate?: Date;
}

export interface Survey {
  msfp_surveyid: string;
  msfp_name: string;
  msfp_surveyurl?: string;
  msfp_projectid?: string;
  msfp_description?: string;
}

export interface SelectedSurvey {
  id: string;
  name: string;
  url: string;
  description?: string;
}

/**
 * Etapy ankiety - Stage 1 to samoocena, Stage 2 i 3 to ocena managerska
 */
export type SurveyStage = 1 | 2 | 3;

/**
 * Poziom dostępu do ankiety dla danego użytkownika i węzła
 */
export type SurveyAccessLevel =
  | "edit"      // Może edytować/wypełniać ankietę
  | "view"      // Może tylko przeglądać (read-only)
  | "none";     // Brak dostępu - przycisk ukryty

/**
 * Wynik weryfikacji dostępu do ankiety
 */
export interface SurveyAccessResult {
  accessLevel: SurveyAccessLevel;
  reason: string;  // Czytelne wyjaśnienie (np. dla tooltip)
  isChainBlocked?: boolean;  // Czy zablokowane przez logikę łańcuchową etapów
  disabledReason?: string;   // Powód blokady dla tooltip (np. "Oczekiwanie na wypełnienie Etapu 1")
}

/**
 * Mapa liczników powiadomień per ankieta
 */
export type SurveyNotificationMap = Map<string, number>;

/**
 * Kontekst użytkownika przekazywany przez prop drilling
 */
export interface UserContext {
  userId: string;                    // GUID zalogowanego użytkownika (context.userSettings.userId)
  userPersonId?: string;             // ID osoby w datasecie odpowiadającej zalogowanemu użytkownikowi
  directSubordinateIds: string[];    // Lista ID bezpośrednich podwładnych
  allSubordinateIds: string[];       // Lista ID wszystkich podwładnych (bezpośrednich i pośrednich)
}
