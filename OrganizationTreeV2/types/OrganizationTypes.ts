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
