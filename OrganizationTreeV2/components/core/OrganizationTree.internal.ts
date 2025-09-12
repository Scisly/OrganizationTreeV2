import * as React from "react";
import { Text } from "@fluentui/react-components";
import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
  Survey,
  SelectedSurvey,
} from "../../types/OrganizationTypes";
import { OrganizationService } from "../../services/data/OrganizationService";
import { LayoutService } from "../../services/layout/LayoutService";
import { Node, Edge } from "reactflow";

/**
 * Custom hook for managing organization tree data and effects
 */
export const useOrganizationTree = (
  dataSet: ComponentFramework.PropertyTypes.DataSet,
  surveyResponsesDataSet: ComponentFramework.PropertyTypes.DataSet,
  surveysDataSet: ComponentFramework.PropertyTypes.DataSet,
  selectedSurvey: SelectedSurvey | null,
  userId?: string,
  showOnlyTeam?: boolean,
  onSurveyChange?: () => void,
) => {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [hierarchy, setHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [fullHierarchy, setFullHierarchy] = React.useState<
    OrganizationPerson[]
  >([]);
  const [allPeople, setAllPeople] = React.useState<OrganizationPerson[]>([]);
  const [surveyResponses, setSurveyResponses] = React.useState<
    SurveyResponse[]
  >([]);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [isLoadingAllData, setIsLoadingAllData] = React.useState(false);

  // Function to load all pages of data
  const loadAllPages = React.useCallback(() => {
    if (!dataSet?.paging?.hasNextPage) {
      return; // All data already loaded
    }

    setIsLoadingAllData(true);
    try {
      // Try to load next page
      if (dataSet.paging.loadNextPage) {
        dataSet.paging.loadNextPage();
        // Recursively load more pages after short delay
        setTimeout(() => {
          loadAllPages();
        }, 100);
      }
    } catch (error) {
      console.error("Error loading next page:", error);
    } finally {
      setIsLoadingAllData(false);
    }
  }, [dataSet]);

  // Effect for loading all data on initialization
  React.useEffect(() => {
    if (dataSet?.paging?.hasNextPage && !isLoadingAllData) {
      loadAllPages();
    }
  }, [dataSet?.paging?.hasNextPage, loadAllPages, isLoadingAllData]);

  // Effect for loading survey responses
  React.useEffect(() => {
    if (
      surveyResponsesDataSet?.sortedRecordIds?.length &&
      surveyResponsesDataSet.sortedRecordIds.length > 0 &&
      selectedSurvey?.id
    ) {
      const responses = OrganizationService.processSurveyResponses(
        surveyResponsesDataSet,
        selectedSurvey.id,
      );
      setSurveyResponses(responses);
    } else {
      setSurveyResponses([]);
    }
  }, [surveyResponsesDataSet, selectedSurvey?.id]);

  // Loading surveys list
  React.useEffect(() => {
    if (surveysDataSet?.records) {
      const loadedSurveys: Survey[] = [];

      for (const recordId of surveysDataSet.sortedRecordIds || []) {
        const record = surveysDataSet.records[recordId];
        const survey: Survey = {
          msfp_surveyid: record.getValue("msfp_surveyid") as string,
          msfp_name: record.getValue("msfp_name") as string,
          msfp_surveyurl: record.getValue("msfp_surveyurl") as string,
          msfp_description: record.getValue("msfp_description") as string,
        };
        loadedSurveys.push(survey);
      }

      setSurveys(loadedSurveys);
    } else {
      setSurveys([]);
    }
  }, [surveysDataSet]);

  return {
    nodes,
    edges,
    hierarchy,
    fullHierarchy,
    allPeople,
    surveyResponses,
    surveys,
    isLoadingAllData,
    setNodes,
    setEdges,
    setHierarchy,
    setFullHierarchy,
    setAllPeople,
    setSurveyResponses,
    setSurveys,
  };
};

/**
 * Builds layout for the organization tree
 */
export const buildLayout = (
  dataSet: ComponentFramework.PropertyTypes.DataSet,
  userId?: string,
  showOnlyTeam?: boolean,
  selectedSurvey?: SelectedSurvey | null,
  surveyResponses?: SurveyResponse[],
  handleSurveyClick?: (personId: string) => void,
  handleResponseClick?: (responseId: string) => void,
) => {
  // First build full hierarchy (without filters) and get all people
  const { hierarchy: fullOrganizationHierarchy, allPeople: allPeopleData } =
    OrganizationService.buildHierarchyWithPeople(dataSet);

  const filterOptions: HierarchyFilterOptions = {
    currentUserId: userId,
    showOnlyTeam,
  };

  const { hierarchy: organizationHierarchy } =
    OrganizationService.buildHierarchyWithPeople(dataSet, filterOptions);

  const { nodes: layoutNodes, edges: layoutEdges } =
    LayoutService.createTreeLayout(
      organizationHierarchy,
      handleSurveyClick ??
        (() => {
          /* no-op */
        }),
      handleResponseClick ??
        (() => {
          /* no-op */
        }),
      surveyResponses ?? [],
      selectedSurvey ?? undefined,
      userId,
      fullOrganizationHierarchy,
      allPeopleData,
    );

  return {
    hierarchy: organizationHierarchy,
    fullHierarchy: fullOrganizationHierarchy,
    allPeople: allPeopleData,
    nodes: layoutNodes,
    edges: layoutEdges,
  };
};

/**
 * Creates filter info renderer
 */
export const createFilterInfoRenderer = (
  userId?: string,
  showOnlyTeam?: boolean,
  allPeople?: OrganizationPerson[],
) => {
  const FilterInfoComponent = () => {
    if (userId) {
      if (showOnlyTeam) {
        // Find user by ag_userid with different GUID format support
        let currentUser = allPeople?.find(
          (person) => person.ag_userid === userId,
        );

        // If not found, try cleaned GUID format
        if (!currentUser && userId) {
          const cleanUserId = userId.replace(/[{}-]/g, "").toLowerCase();
          currentUser = allPeople?.find((person) => {
            if (!person.ag_userid) return false;
            const cleanAgUserId = person.ag_userid
              .replace(/[{}-]/g, "")
              .toLowerCase();
            return cleanAgUserId === cleanUserId;
          });
        }

        return React.createElement(
          Text,
          { className: "filterInfo" },
          `Widok zespołu: ${currentUser?.name ?? "Nieznany użytkownik"}`
        );
      } else {
        return React.createElement(
          Text,
          { className: "filterInfo" },
          "Pełna hierarchia organizacyjna"
        );
      }
    }

    return React.createElement(
      Text,
      { className: "filterInfo" },
      "Hierarchia organizacyjna (brak identyfikatora użytkownika)"
    );
  };

  FilterInfoComponent.displayName = "FilterInfoComponent";
  return FilterInfoComponent;
};

/**
 * Loads surveys from dataset and creates Survey objects
 */
export const loadSurveysFromDataSet = (
  surveysDataSet: ComponentFramework.PropertyTypes.DataSet,
): Survey[] => {
  if (!surveysDataSet?.records) {
    return [];
  }

  const loadedSurveys: Survey[] = [];

  for (const recordId of surveysDataSet.sortedRecordIds || []) {
    const record = surveysDataSet.records[recordId];
    const survey: Survey = {
      msfp_surveyid: record.getValue("msfp_surveyid") as string,
      msfp_name: record.getValue("msfp_name") as string,
      msfp_surveyurl: record.getValue("msfp_surveyurl") as string,
      msfp_description: record.getValue("msfp_description") as string,
    };
    loadedSurveys.push(survey);
  }

  return loadedSurveys;
};

/**
 * Handles auto-selection of first survey if none selected
 */
export const handleAutoSurveySelection = (
  surveys: Survey[],
  selectedSurvey: SelectedSurvey | null,
  setSelectedSurvey: (survey: SelectedSurvey) => void,
  onSurveyChange?: () => void,
): void => {
  if (surveys.length > 0 && !selectedSurvey) {
    const firstSurvey = {
      id: surveys[0].msfp_surveyid,
      name: surveys[0].msfp_name,
      url: surveys[0].msfp_surveyurl ?? "",
      description: surveys[0].msfp_description ?? "",
    };
    setSelectedSurvey(firstSurvey);

    // Call callback for automatic selection
    if (onSurveyChange) {
      onSurveyChange();
    }
  }
};

/**
 * Calculates responsive dimensions based on container width
 */
export const calculateResponsiveDimensions = (containerWidth?: number) => {
  const actualContainerWidth = containerWidth ?? 1600; // fallback to default
  const RESPONSIVE_CONTAINER_WIDTH = actualContainerWidth - 1; // Subtract for border/padding
  const RESPONSIVE_TREE_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.7);
  const RESPONSIVE_LIST_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.15);
  const RESPONSIVE_DESC_WIDTH =
    RESPONSIVE_CONTAINER_WIDTH - RESPONSIVE_TREE_WIDTH - RESPONSIVE_LIST_WIDTH;

  return {
    RESPONSIVE_CONTAINER_WIDTH,
    RESPONSIVE_TREE_WIDTH,
    RESPONSIVE_LIST_WIDTH,
    RESPONSIVE_DESC_WIDTH,
  };
};
