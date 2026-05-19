import * as React from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  ReactFlowProvider,
  Panel,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
  shorthands,
  tokens,
  Button,
  Text,
  Input,
} from "@fluentui/react-components";
import { PersonNode } from "./PersonNode";
import { LoadingState } from "./LoadingState";
import { SurveyPanel } from "./SurveyPanel";
import { DescriptionPanel } from "./DescriptionPanel";
import { OrganizationService } from "../services/OrganizationService";
import { LayoutService } from "../services/LayoutService";
import { SurveyAccessService } from "../services/SurveyAccessService";
import { useDatasetLoading } from "../hooks/useDatasetLoading";
import { useDebounce } from "../hooks/useDebounce";
import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
  Survey,
  SelectedSurvey,
  UserContext,
  SurveyNotificationMap,
} from "../types/OrganizationTypes";
import { Filter20Regular, Organization20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    minWidth: "0",
    height: "100%",
  },
  reactFlowContainer: {
    width: "100%",
    height: "100%",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  reactFlowWrapper: {
    width: "100%",
    height: "100%",
    flex: "1 1 auto",
    position: "relative",
    "& .react-flow": {
      width: "100%",
      height: "100%",
    },
  },
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding("12px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    minWidth: "300px",
  },
  panelRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  filterInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  searchInput: {
    width: "250px",
  },
});

// Fixed height constant
const FIXED_HEIGHT = 768;

// Node types for ReactFlow
const nodeTypes = {
  person: PersonNode,
};

// Inner component with ReactFlow hooks
const ReactFlowContent: React.FC<{
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  styles: ReturnType<typeof useStyles>;
  userId?: string;
  showOnlyTeam: boolean;
  toggleTeamFilter: () => void;
  renderFilterInfo: () => React.ReactElement;
  onInit: (instance: ReturnType<typeof useReactFlow>) => void;
  searchText: string;
  handleSearchChange: (text: string) => void;
  primaryRootId?: string;
}> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  styles,
  userId,
  showOnlyTeam,
  toggleTeamFilter,
  renderFilterInfo,
  onInit,
  searchText,
  handleSearchChange,
  primaryRootId,
}) => {
  const reactFlowInstance = useReactFlow();

  // Auto-center view on logged-in user
  React.useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        const nodesWithValidPositions = nodes.filter(
          (node) =>
            node.position.x !== undefined && node.position.y !== undefined
        );

        if (nodesWithValidPositions.length === nodes.length) {
          if (primaryRootId) {
            const userNode = reactFlowInstance.getNode(primaryRootId);
            if (userNode) {
              const nodeWidth = userNode.width ?? 253;
              const nodeHeight = userNode.height ?? 161;

              reactFlowInstance.setCenter(
                userNode.position.x + nodeWidth / 2,
                userNode.position.y + nodeHeight / 2,
                { duration: 500, zoom: 1.0 }
              );
              return;
            }
          }

          // Fallback: center on first node
          const firstNode = nodes[0];
          if (firstNode) {
            reactFlowInstance.setCenter(
              firstNode.position.x + 253 / 2,
              firstNode.position.y + 161 / 2,
              { duration: 500, zoom: 1.0 }
            );
          }
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [reactFlowInstance, nodes.length, primaryRootId]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Loose}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      selectNodesOnDrag={false}
      panOnDrag={true}
      zoomOnScroll={true}
      zoomOnPinch={true}
      onInit={onInit}
      fitView={false}
      minZoom={0.1}
      maxZoom={2}
      style={{ width: "100%", height: "100%" }}
    >
      <Background />

      <Panel position="top-left" className={styles.panel}>
        <div className={styles.panelRow}>
          <Organization20Regular />
          {renderFilterInfo()}

          {userId && (
            <Button
              appearance="subtle"
              size="small"
              icon={<Filter20Regular />}
              onClick={toggleTeamFilter}
            >
              {showOnlyTeam ? "Pokaż wszystkich" : "Tylko mój zespół"}
            </Button>
          )}
        </div>

        <div className={styles.panelRow}>
          <Input
            className={styles.searchInput}
            placeholder="Wyszukaj po imieniu i nazwisku..."
            value={searchText}
            style={{ width: "100%" }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              handleSearchChange(event.target.value)
            }
          />
        </div>
      </Panel>

      <Panel
        position="top-left"
        className={styles.panel}
        style={{
          top: 220,
          left: -14,
          background: "transparent",
          border: "lightgray",
          padding: 0,
        }}
      >
        <Controls />
      </Panel>
    </ReactFlow>
  );
};

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
  userId,
  containerWidth,
  onSurveyClick,
  onResponseClick,
  onSurveyChange,
}) => {
  const styles = useStyles();

  // Calculate responsive dimensions
  const actualContainerWidth = containerWidth ?? 1600;
  const RESPONSIVE_CONTAINER_WIDTH = actualContainerWidth - 2;
  const RESPONSIVE_TREE_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.7) - 2;
  const RESPONSIVE_LIST_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.15) - 2;
  const RESPONSIVE_DESC_WIDTH =
    RESPONSIVE_CONTAINER_WIDTH - RESPONSIVE_TREE_WIDTH - RESPONSIVE_LIST_WIDTH - 2;

  // Use the new dataset loading hook
  const loadingStatus = useDatasetLoading(
    dataSet,
    surveysDataSet,
    surveyResponsesDataSet
  );

  // Core state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showOnlyTeam, setShowOnlyTeam] = React.useState(true);
  const [hierarchy, setHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [, setFullHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [allPeople, setAllPeople] = React.useState<OrganizationPerson[]>([]);
  const [surveyResponses, setSurveyResponses] = React.useState<SurveyResponse[]>([]);
  const [allSurveyResponses, setAllSurveyResponses] = React.useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = React.useState<SelectedSurvey | null>(null);
  const [searchText, setSearchText] = React.useState<string>("");
  const [collapsedNodeIds, setCollapsedNodeIds] = React.useState<string[]>([]);

  // Refs for tracking state
  const collapseInitializedRef = React.useRef(false);
  const surveysInitializedRef = React.useRef(false);

  // Debounced search for performance
  const debouncedSearchText = useDebounce(searchText, 300);

  // Callbacks using refs for stability
  const handleSurveyClickRef = React.useRef(onSurveyClick);
  const handleResponseClickRef = React.useRef(onResponseClick);
  handleSurveyClickRef.current = onSurveyClick;
  handleResponseClickRef.current = onResponseClick;

  // Survey click handler
  const handleSurveyClick = React.useCallback(
    (personId: string) => {
      if (selectedSurvey?.url) {
        const fullSurveyUrl = `${selectedSurvey.url}&ctx=%7B"personId"%3A"${personId}"%7D`;
        handleSurveyClickRef.current(personId, fullSurveyUrl);
      }
    },
    [selectedSurvey?.url]
  );

  // Response click handler
  const handleResponseClick = React.useCallback((responseId: string) => {
    handleResponseClickRef.current(responseId);
  }, []);

  // Search change handler
  const handleSearchChange = React.useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Toggle collapse handler
  const handleToggleCollapse = React.useCallback((personId: string) => {
    setCollapsedNodeIds((previous) => {
      if (previous.includes(personId)) {
        return previous.filter((id) => id !== personId);
      }
      return [...previous, personId];
    });
  }, []);

  // Filter people by name (recursive)
  const filterPeopleByName = React.useCallback(
    (people: OrganizationPerson[], searchTerm: string): OrganizationPerson[] => {
      if (!searchTerm.trim()) {
        return people;
      }

      const searchTermLower = searchTerm.toLowerCase().trim();

      const filterRecursive = (
        personList: OrganizationPerson[]
      ): OrganizationPerson[] => {
        const filtered: OrganizationPerson[] = [];

        for (const person of personList) {
          const fullName = `${person.name}`.toLowerCase();
          const matchesSearch = fullName.includes(searchTermLower);
          const filteredChildren = person.children
            ? filterRecursive(person.children)
            : [];

          if (matchesSearch || filteredChildren.length > 0) {
            filtered.push({
              ...person,
              children: filteredChildren,
            });
          }
        }

        return filtered;
      };

      return filterRecursive(people);
    },
    []
  );

  // Toggle team filter
  const toggleTeamFilter = React.useCallback(() => {
    setShowOnlyTeam((prev) => !prev);
  }, []);

  // ============================================
  // EFFECT 1: Load and process surveys
  // ============================================
  React.useEffect(() => {
    if (!surveysDataSet?.records || surveysDataSet.loading) {
      return;
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

    // Sort surveys alphabetically
    const sortedSurveys = loadedSurveys.sort((a, b) => {
      const nameA = a.msfp_name?.toLowerCase() || "";
      const nameB = b.msfp_name?.toLowerCase() || "";
      return nameA.localeCompare(nameB, "pl", { sensitivity: "accent" });
    });

    setSurveys(sortedSurveys);

    // Auto-select first survey only once
    if (sortedSurveys.length > 0 && !surveysInitializedRef.current) {
      surveysInitializedRef.current = true;
      const firstSurvey = sortedSurveys[0];
      setSelectedSurvey({
        id: firstSurvey.msfp_surveyid,
        name: firstSurvey.msfp_name,
        url: firstSurvey.msfp_surveyurl ?? "",
        description: firstSurvey.msfp_description ?? "",
      });

      if (onSurveyChange) {
        onSurveyChange();
      }
    }
  }, [surveysDataSet?.sortedRecordIds?.length, surveysDataSet?.loading, onSurveyChange]);

  // ============================================
  // EFFECT 2: Load survey responses (for selected survey)
  // ============================================
  React.useEffect(() => {
    if (
      !surveyResponsesDataSet?.sortedRecordIds?.length ||
      surveyResponsesDataSet.loading ||
      !selectedSurvey?.id
    ) {
      setSurveyResponses([]);
      return;
    }

    const responses = OrganizationService.processSurveyResponses(
      surveyResponsesDataSet,
      selectedSurvey.id
    );
    setSurveyResponses(responses);
  }, [
    surveyResponsesDataSet?.sortedRecordIds?.length,
    surveyResponsesDataSet?.loading,
    selectedSurvey?.id,
  ]);

  // ============================================
  // EFFECT 2.5: Load ALL survey responses (for chained logic)
  // ============================================
  React.useEffect(() => {
    if (
      !surveyResponsesDataSet?.sortedRecordIds?.length ||
      surveyResponsesDataSet.loading
    ) {
      setAllSurveyResponses([]);
      return;
    }

    const allResponses = OrganizationService.processSurveyResponsesAll(
      surveyResponsesDataSet
    );
    setAllSurveyResponses(allResponses);
  }, [
    surveyResponsesDataSet?.sortedRecordIds?.length,
    surveyResponsesDataSet?.loading,
  ]);

  // ============================================
  // EFFECT 3: Build hierarchy and layout
  // ============================================
  React.useEffect(() => {
    if (!dataSet?.sortedRecordIds?.length || dataSet.loading) {
      return;
    }

    // Build full hierarchy
    const { hierarchy: fullOrganizationHierarchy, allPeople: allPeopleData } =
      OrganizationService.buildHierarchyWithPeople(dataSet);
    setFullHierarchy(fullOrganizationHierarchy);
    setAllPeople(allPeopleData);

    // Build filtered hierarchy
    const filterOptions: HierarchyFilterOptions = {
      currentUserId: userId,
      showOnlyTeam,
    };

    const { hierarchy: organizationHierarchy } =
      OrganizationService.buildHierarchyWithPeople(dataSet, filterOptions);

    // Apply search filter
    const filteredHierarchy = filterPeopleByName(
      organizationHierarchy,
      debouncedSearchText
    );
    setHierarchy(filteredHierarchy);

    // Collect all IDs for collapse management
    const filteredHierarchyIds: string[] = [];
    const collectIds = (people: OrganizationPerson[]) => {
      people.forEach((person) => {
        filteredHierarchyIds.push(person.id);
        if (person.children?.length) {
          collectIds(person.children);
        }
      });
    };
    collectIds(filteredHierarchy);

    const rootIds = filteredHierarchy.map((person) => person.id);

    // Initialize collapse state
    let effectiveCollapsedIds = collapsedNodeIds;
    if (
      !collapseInitializedRef.current &&
      collapsedNodeIds.length === 0 &&
      filteredHierarchy.length > 0 &&
      debouncedSearchText.trim() === ""
    ) {
      const defaultCollapsed = filteredHierarchyIds.filter(
        (id) => !rootIds.includes(id)
      );
      collapseInitializedRef.current = true;
      effectiveCollapsedIds = defaultCollapsed;
      setCollapsedNodeIds(defaultCollapsed);
    }

    const collapsedSet = new Set(effectiveCollapsedIds);

    // Apply collapse to hierarchy
    const applyCollapseToHierarchy = (
      people: OrganizationPerson[]
    ): OrganizationPerson[] =>
      people.map((person) => {
        const originalChildren = person.children ?? [];
        const visibleChildren =
          !collapsedSet.has(person.id) && originalChildren.length > 0
            ? applyCollapseToHierarchy(originalChildren)
            : [];

        return {
          ...person,
          children: visibleChildren,
        };
      });

    const visibleHierarchy = applyCollapseToHierarchy(filteredHierarchy);

    // Build user context for permissions
    const userContext: UserContext | undefined = userId
      ? SurveyAccessService.buildUserContext(userId, allPeopleData)
      : undefined;

    // Create layout
    const { nodes: layoutNodes, edges: layoutEdges } =
      LayoutService.createTreeLayout(
        visibleHierarchy,
        handleSurveyClick,
        handleResponseClick,
        surveyResponses,
        selectedSurvey ?? undefined,
        userId,
        fullOrganizationHierarchy,
        allPeopleData,
        userContext,
        allSurveyResponses,
        surveys
      );

    // Mark parents with children
    const parentsWithChildren = new Set<string>();
    const markParents = (people: OrganizationPerson[]) => {
      people.forEach((person) => {
        if (person.children?.length) {
          parentsWithChildren.add(person.id);
          markParents(person.children);
        }
      });
    };
    markParents(fullOrganizationHierarchy);

    // Add metadata to nodes
    const nodeIdSet = new Set<string>();
    const nodesWithMetadata = layoutNodes.map((node) => {
      nodeIdSet.add(node.id);
      const hasChildren = parentsWithChildren.has(node.id);
      const isCollapsed = hasChildren ? collapsedSet.has(node.id) : false;

      return {
        ...node,
        data: {
          ...node.data,
          hasChildren,
          isCollapsed,
          onToggleCollapse: hasChildren ? handleToggleCollapse : undefined,
        },
      };
    });

    // Filter edges to only include valid connections
    const filteredEdges = layoutEdges.filter(
      (edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    );

    setNodes(nodesWithMetadata);
    setEdges(filteredEdges);
  }, [
    dataSet?.sortedRecordIds?.length,
    dataSet?.loading,
    userId,
    showOnlyTeam,
    debouncedSearchText,
    surveyResponses,
    selectedSurvey,
    collapsedNodeIds,
    filterPeopleByName,
    handleSurveyClick,
    handleResponseClick,
    handleToggleCollapse,
    setNodes,
    setEdges,
    allSurveyResponses,
    surveys,
  ]);

  // ============================================
  // EFFECT 4: Reset collapse state on hierarchy change
  // ============================================
  React.useEffect(() => {
    if (!hierarchy.length) {
      setCollapsedNodeIds([]);
      collapseInitializedRef.current = false;
      return;
    }

    const allIds: string[] = [];
    const collectIds = (people: OrganizationPerson[]) => {
      people.forEach((person) => {
        allIds.push(person.id);
        if (person.children?.length) {
          collectIds(person.children);
        }
      });
    };
    collectIds(hierarchy);

    const validIds = new Set(allIds);

    setCollapsedNodeIds((previous) => {
      const sanitized = previous.filter((id) => validIds.has(id));
      if (sanitized.length !== previous.length) {
        return sanitized;
      }
      return previous;
    });
  }, [hierarchy]);

  // Find primary root ID for centering
  const primaryRootId = React.useMemo(() => {
    const currentUser = OrganizationService.findUserByUserId(userId ?? "", allPeople);
    return currentUser?.id ?? hierarchy[0]?.id;
  }, [userId, allPeople, hierarchy]);

  // ReactFlow init handler
  const handleReactFlowInit = React.useCallback(
    (instance: ReturnType<typeof useReactFlow>) => {
      if (nodes.length > 0) {
        setTimeout(() => {
          if (primaryRootId) {
            const userNode = instance.getNode(primaryRootId);
            if (userNode) {
              instance.setCenter(
                userNode.position.x + (userNode.width ?? 253) / 2,
                userNode.position.y + (userNode.height ?? 161) / 2,
                { duration: 300, zoom: 1.0 }
              );
              return;
            }
          }

          const firstNode = instance.getNodes()[0];
          if (firstNode) {
            instance.setCenter(
              firstNode.position.x + 253 / 2,
              firstNode.position.y + 161 / 2,
              { duration: 300, zoom: 1.0 }
            );
          }
        }, 100);
      }
    },
    [nodes.length, primaryRootId]
  );

  // Survey selection handler
  const handleSurveySelect = React.useCallback(
    (survey: Survey) => {
      setSelectedSurvey({
        id: survey.msfp_surveyid,
        name: survey.msfp_name,
        url: survey.msfp_surveyurl ?? "",
        description: survey.msfp_description ?? "",
      });

      if (onSurveyChange) {
        onSurveyChange();
      }
    },
    [onSurveyChange]
  );

  // ============================================
  // Calculate notification counts for surveys (only in "My Team" view)
  // ============================================
  const surveyNotifications: SurveyNotificationMap = React.useMemo(() => {
    const notificationMap = new Map<string, number>();

    // Only calculate for "My Team" view with valid user context
    if (!showOnlyTeam || !userId || surveys.length === 0 || allPeople.length === 0) {
      return notificationMap;
    }

    // Build user context for calculations
    const userContext = SurveyAccessService.buildUserContext(userId, allPeople);
    if (!userContext.userPersonId || userContext.directSubordinateIds.length === 0) {
      return notificationMap;
    }

    // Calculate pending tasks for each survey
    for (const survey of surveys) {
      const pendingCount = SurveyAccessService.calculatePendingTasks(
        survey,
        userContext,
        allPeople,
        allSurveyResponses,
        surveys
      );
      if (pendingCount > 0) {
        notificationMap.set(survey.msfp_surveyid, pendingCount);
      }
    }

    return notificationMap;
  }, [showOnlyTeam, userId, surveys, allPeople, allSurveyResponses]);

  // Render filter info
  const renderFilterInfo = React.useCallback(() => {
    const totalFilteredNodes = nodes.length;
    const searchInfo = searchText.trim()
      ? ` (znaleziono: ${totalFilteredNodes})`
      : "";

    if (userId) {
      if (showOnlyTeam) {
        const currentUser = OrganizationService.findUserByUserId(userId, allPeople);
        return (
          <Text className={styles.filterInfo}>
            Widok zespołu: {currentUser?.name ?? "Nieznany użytkownik"}
            {searchInfo}
          </Text>
        );
      }
      return (
        <Text className={styles.filterInfo}>
          Pełna hierarchia organizacyjna{searchInfo}
        </Text>
      );
    }

    return (
      <Text className={styles.filterInfo}>
        Hierarchia organizacyjna (brak identyfikatora użytkownika){searchInfo}
      </Text>
    );
  }, [nodes.length, searchText, userId, showOnlyTeam, allPeople, styles.filterInfo]);

  // ============================================
  // RENDER: Loading and empty states
  // ============================================
  const loadingStateElement = (
    <LoadingState
      width={RESPONSIVE_CONTAINER_WIDTH}
      height={FIXED_HEIGHT}
      isLoading={loadingStatus.isInitialLoading || (dataSet?.loading ?? false)}
      isEmpty={!loadingStatus.hasOrganizationData && !dataSet?.loading}
      error={loadingStatus.error}
    />
  );

  // Show loading state if applicable
  if (loadingStatus.isInitialLoading || (dataSet?.loading && !loadingStatus.hasOrganizationData)) {
    return loadingStateElement;
  }

  // Show empty state if no data
  if (!loadingStatus.hasOrganizationData) {
    return loadingStateElement;
  }

  // ============================================
  // RENDER: Main content
  // ============================================
  return (
    <FluentProvider theme={webLightTheme}>
      <div
        className={styles.container}
        style={{
          width: `${RESPONSIVE_CONTAINER_WIDTH}px`,
          height: `${FIXED_HEIGHT}px`,
        }}
      >
        {/* Main column - organization tree (70%) */}
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
                  styles={styles}
                  userId={userId}
                  showOnlyTeam={showOnlyTeam}
                  toggleTeamFilter={toggleTeamFilter}
                  renderFilterInfo={renderFilterInfo}
                  onInit={handleReactFlowInit}
                  searchText={searchText}
                  handleSearchChange={handleSearchChange}
                  primaryRootId={primaryRootId}
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
          height={FIXED_HEIGHT}
          notificationCounts={surveyNotifications}
        />

        {/* Description panel (15%) */}
        <DescriptionPanel
          description={selectedSurvey?.description}
          width={RESPONSIVE_DESC_WIDTH}
          height={FIXED_HEIGHT}
        />
      </div>
    </FluentProvider>
  );
};
