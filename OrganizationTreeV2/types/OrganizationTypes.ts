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
  type: 'person';
  position: { x: number; y: number };
  data: {
    person: OrganizationPerson;
    surveyUrl: string;
    onSurveyClick: (personId: string) => void;
    onResponseClick?: (responseUrl: string) => void;
    userId?: string;
    fullHierarchy: OrganizationPerson[];
    allPeople?: OrganizationPerson[];
    showSurveyButton?: boolean;
    surveyResponse?: SurveyResponse;
  };
}

export interface OrganizationEdge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep';
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
