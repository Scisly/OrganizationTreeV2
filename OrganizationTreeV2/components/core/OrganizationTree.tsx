import * as React from "react";
import {
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  FluentProvider,
  webLightTheme,
  Text,
} from "@fluentui/react-components";
import { Organization20Regular } from "@fluentui/react-icons";
import { OrganizationService } from "../../services/data/OrganizationService";
import { LayoutService } from "../../services/layout/LayoutService";
import { FIXED_HEIGHT } from "../../services/utils/constants";
import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
  Survey,
  SelectedSurvey,
} from "../../types/OrganizationTypes";
import { useOrganizationTreeStyles } from "./OrganizationTree.styles";
import { ReactFlowContent } from "../panels/ReactFlowContent";
import { SurveyPanel } from "../panels/SurveyPanel";
import { DescriptionPanel } from "../panels/DescriptionPanel";
import {
  calculateResponsiveDimensions,
  createFilterInfoRenderer,
  loadSurveysFromDataSet,
  handleAutoSurveySelection,
} from "./OrganizationTree.internal";

export interface OrganizationTreeProps {
  dataSet: ComponentFramework.PropertyTypes.DataSet;
  surveyResponsesDataSet: ComponentFramework.PropertyTypes.DataSet;
  surveysDataSet: ComponentFramework.PropertyTypes.DataSet;
  projectId?: string;
  userId?: string;
  containerWidth?: number;
  onSurveyClick: (personId: string, surveyUrl: string) => void;
  onResponseClick: (responseId: string) => void;
  onSurveyChange?: () => void;
}

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  dataSet,
  surveyResponsesDataSet,
  surveysDataSet,
  projectId,
  userId,
  containerWidth,
  onSurveyClick,
  onResponseClick,
  onSurveyChange,
}) => {
  const styles = useOrganizationTreeStyles();
  
  // Calculate responsive dimensions with useMemo for performance
  const responsiveDimensions = React.useMemo(() => 
    calculateResponsiveDimensions(containerWidth), 
    [containerWidth]
  );

  const {
    RESPONSIVE_CONTAINER_WIDTH,
    RESPONSIVE_TREE_WIDTH,
    RESPONSIVE_LIST_WIDTH,
    RESPONSIVE_DESC_WIDTH,
  } = responsiveDimensions;

  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showOnlyTeam, setShowOnlyTeam] = React.useState(true);
  const [hierarchy, setHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [fullHierarchy, setFullHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [allPeople, setAllPeople] = React.useState<OrganizationPerson[]>([]);
  const [surveyResponses, setSurveyResponses] = React.useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = React.useState<SelectedSurvey | null>(null);
  const [isLoadingAllData, setIsLoadingAllData] = React.useState(false);

  // Use ref to avoid circular dependencies in useCallback
  const loadAllPagesRef = React.useRef<() => void>();

  // Data loading function
  const loadAllPages = React.useCallback(() => {
    if (!dataSet?.paging?.hasNextPage || isLoadingAllData) {
      return; // All data already loaded or loading in progress
    }

    setIsLoadingAllData(true);
    try {
      if (dataSet.paging && typeof dataSet.paging.loadNextPage === 'function') {
        const loadNextPage = dataSet.paging.loadNextPage.bind(dataSet.paging);
        loadNextPage();
        setTimeout(() => {
          // Use ref to avoid circular dependency
          if (loadAllPagesRef.current) {
            loadAllPagesRef.current();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading next page:", error);
      setIsLoadingAllData(false);
    }
  }, [dataSet?.paging?.hasNextPage, isLoadingAllData]);

  // Update ref when function changes
  loadAllPagesRef.current = loadAllPages;

  // Survey handlers
  const handleSurveyClick = React.useCallback(
    (personId: string) => {
      if (selectedSurvey?.url) {
        const fullSurveyUrl = `${selectedSurvey.url}&ctx=%7B"personId"%3A"${personId}"%7D`;
        onSurveyClick(personId, fullSurveyUrl);
      }
    },
    [selectedSurvey?.url, onSurveyClick],
  );

  const handleResponseClick = React.useCallback(
    (responseId: string) => {
      if (onResponseClick) {
        onResponseClick(responseId);
      }
    },
    [onResponseClick],
  );

  const handleSurveySelect = React.useCallback(
    (survey: Survey) => {
      const newSelectedSurvey = {
        id: survey.msfp_surveyid,
        name: survey.msfp_name,
        url: survey.msfp_surveyurl ?? "",
        description: survey.msfp_description ?? "",
      };
      setSelectedSurvey(newSelectedSurvey);

      // Call callback to force view refresh
      if (onSurveyChange) {
        onSurveyChange();
      }
    },
    [onSurveyChange]
  );
  
  const toggleTeamFilter = React.useCallback(() => {
    setShowOnlyTeam(!showOnlyTeam);
  }, [showOnlyTeam]);

  // Layout building
  const buildLayout = React.useCallback(() => {
    const { hierarchy: fullOrganizationHierarchy, allPeople: allPeopleData } =
      OrganizationService.buildHierarchyWithPeople(dataSet);
    setFullHierarchy(fullOrganizationHierarchy);
    setAllPeople(allPeopleData);

    const filterOptions: HierarchyFilterOptions = {
      currentUserId: userId,
      showOnlyTeam,
    };

    const { hierarchy: organizationHierarchy } =
      OrganizationService.buildHierarchyWithPeople(dataSet, filterOptions);
    setHierarchy(organizationHierarchy);

    const { nodes: layoutNodes, edges: layoutEdges } =
      LayoutService.createTreeLayout(
        organizationHierarchy,
        handleSurveyClick,
        handleResponseClick,
        surveyResponses,
        selectedSurvey ?? undefined,
        userId,
        fullOrganizationHierarchy,
        allPeopleData,
      );

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [
    dataSet,
    selectedSurvey?.id,
    selectedSurvey?.url,
    userId,
    showOnlyTeam,
    surveyResponses,
    handleSurveyClick,
    handleResponseClick,
  ]);

  // Effects
  React.useEffect(() => {
    if (dataSet?.paging?.hasNextPage && !isLoadingAllData) {
      loadAllPages();
    }
  }, [dataSet?.paging?.hasNextPage, isLoadingAllData, loadAllPages]);

  React.useEffect(() => {
    const hasRecords = dataSet?.sortedRecordIds?.length && dataSet.sortedRecordIds.length > 0;
    if (hasRecords) {
      buildLayout();
    }
  }, [dataSet?.sortedRecordIds?.length, buildLayout]);

  React.useEffect(() => {
    const hasResponseData = surveyResponsesDataSet?.sortedRecordIds?.length && 
                          surveyResponsesDataSet.sortedRecordIds.length > 0 &&
                          selectedSurvey?.id;
    
    if (hasResponseData) {
      const responses = OrganizationService.processSurveyResponses(
        surveyResponsesDataSet,
        selectedSurvey.id,
      );
      setSurveyResponses(responses);
    } else {
      setSurveyResponses([]);
    }
  }, [surveyResponsesDataSet?.sortedRecordIds?.length, selectedSurvey?.id]);

  React.useEffect(() => {
    const loadedSurveys = loadSurveysFromDataSet(surveysDataSet);
    setSurveys(loadedSurveys);
    
    // Use callback to avoid recreating the function each render
    if (loadedSurveys.length > 0 && !selectedSurvey) {
      const firstSurvey = {
        id: loadedSurveys[0].msfp_surveyid,
        name: loadedSurveys[0].msfp_name,
        url: loadedSurveys[0].msfp_surveyurl ?? "",
        description: loadedSurveys[0].msfp_description ?? "",
      };
      setSelectedSurvey(firstSurvey);

      // Call callback for automatic selection
      if (onSurveyChange) {
        onSurveyChange();
      }
    }
  }, [surveysDataSet, selectedSurvey, onSurveyChange]);

  // Render filter info - memoized for performance
  const renderFilterInfo = React.useMemo(
    () => createFilterInfoRenderer(userId, showOnlyTeam, allPeople),
    [userId, showOnlyTeam, allPeople]
  );

  // Empty state - CHECK AFTER ALL HOOKS
  if (!dataSet?.sortedRecordIds?.length) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          className={styles.container}
          style={{
            width: `${RESPONSIVE_CONTAINER_WIDTH}px`,
            height: `${FIXED_HEIGHT}px`,
          }}
        >
          <div className={styles.emptyState}>
            <Organization20Regular className={styles.emptyStateIcon} />
            <Text className={styles.emptyStateText}>
              Brak danych organizacyjnych do wyświetlenia
            </Text>
          </div>
        </div>
      </FluentProvider>
    );
  }

  // Main render
  return (
    <FluentProvider theme={webLightTheme}>
      <div
        className={styles.container}
        style={{
          width: `${RESPONSIVE_CONTAINER_WIDTH}px`,
          height: `${FIXED_HEIGHT}px`,
        }}
      >
        {/* Main tree column (70%) */}
        <div
          className={styles.mainContent}
          style={{
            width: `${RESPONSIVE_TREE_WIDTH}px`,
            height: `${FIXED_HEIGHT}px`,
          }}
        >
          <div
            className={styles.reactFlowContainer}
            style={{
              width: `${RESPONSIVE_TREE_WIDTH}px`,
              height: `${FIXED_HEIGHT}px`,
            }}
          >
            <div className={styles.reactFlowWrapper}>
              <ReactFlowProvider>
                <ReactFlowContent
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  userId={userId}
                  showOnlyTeam={showOnlyTeam}
                  allPeople={allPeople}
                  hierarchy={hierarchy}
                  toggleTeamFilter={toggleTeamFilter}
                  renderFilterInfo={renderFilterInfo}
                />
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {/* Survey panel (15%) */}
        <SurveyPanel
          surveys={surveys}
          selectedSurvey={selectedSurvey}
          onSurveySelect={handleSurveySelect}
          width={RESPONSIVE_LIST_WIDTH}
        />

        {/* Description panel (15%) */}
        <DescriptionPanel
          selectedSurvey={selectedSurvey}
          width={RESPONSIVE_DESC_WIDTH}
        />
      </div>
    </FluentProvider>
  );
};
