import * as React from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider,
  Panel,
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
} from "@fluentui/react-components";
import { PersonNode } from "./PersonNode";
import { OrganizationService } from "../services/OrganizationService";
import { LayoutService } from "../services/LayoutService";
import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
} from "../types/OrganizationTypes";
import { Filter20Regular, Organization20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    width: "80vw",
    height: "60vh",
    //minHeight: '400px',
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    maxWidth: "90vw",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
  },
  reactFlowWrapper: {
    width: "100%",
    height: "100%",
    minHeight: "400px",
    flex: "1 1 auto",
  },
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding("12px"),
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  filterInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  emptyStateIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground3,
  },
  emptyStateText: {
    color: tokens.colorNeutralForeground2,
  },
});

// Typy węzłów dostępne w ReactFlow
const nodeTypes = {
  person: PersonNode,
};

export interface OrganizationTreeProps {
  dataSet: ComponentFramework.PropertyTypes.DataSet;
  surveyResponsesDataSet: ComponentFramework.PropertyTypes.DataSet;
  surveyUrl: string;
  surveyId: string;
  userId?: string;
  onSurveyClick: (personId: string, surveyUrl: string) => void;
  onResponseClick: (responseUrl: string) => void;
}

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  dataSet,
  surveyResponsesDataSet,
  surveyUrl,
  surveyId,
  userId,
  onSurveyClick,
  onResponseClick,
}) => {
  const styles = useStyles();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showOnlyTeam, setShowOnlyTeam] = React.useState(true); // Domyślnie pokaż zespół
  const [hierarchy, setHierarchy] = React.useState<OrganizationPerson[]>([]);
  const [fullHierarchy, setFullHierarchy] = React.useState<
    OrganizationPerson[]
  >([]);
  const [allPeople, setAllPeople] = React.useState<OrganizationPerson[]>([]);
  const [surveyResponses, setSurveyResponses] = React.useState<
    SurveyResponse[]
  >([]);
  const [isLoadingAllData, setIsLoadingAllData] = React.useState(false);

  // Funkcja do ładowania wszystkich stron danych
  const loadAllPages = React.useCallback(() => {
    if (!dataSet?.paging?.hasNextPage) {
      return; // Wszystkie dane już załadowane
    }

    setIsLoadingAllData(true);
    try {
      // Próba załadowania następnej strony
      if (dataSet.paging.loadNextPage) {
        dataSet.paging.loadNextPage();
        // Rekurencyjnie załaduj kolejne strony po krótkiej przerwie
        setTimeout(() => {
          loadAllPages();
        }, 100);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania kolejnej strony:", error);
    } finally {
      setIsLoadingAllData(false);
    }
  }, [dataSet]);

  // Efekt do ładowania wszystkich danych przy inicjalizacji
  React.useEffect(() => {
    if (dataSet?.paging?.hasNextPage && !isLoadingAllData) {
      loadAllPages();
    }
  }, [dataSet?.paging?.hasNextPage, loadAllPages, isLoadingAllData]);

  // Callback dla kliknięcia przycisku ankiety
  const handleSurveyClick = React.useCallback(
    (personId: string) => {
      const fullSurveyUrl = `${surveyUrl}&ctx=%7B"personId"%3A"${personId}"%7D`;
      onSurveyClick(personId, fullSurveyUrl);
    },
    [surveyUrl, onSurveyClick]
  );

  // Budowanie hierarchii i layoutu
  const handleResponseClick = React.useCallback(
    (responseUrl: string) => {
      if (onResponseClick) {
        onResponseClick(responseUrl);
      }
    },
    [onResponseClick]
  );

  const buildLayout = React.useCallback(() => {
    // Najpierw zbuduj pełną hierarchię (bez filtrów) i pobierz wszystkie osoby
    const {
      hierarchy: fullOrganizationHierarchy,
      allPeople: allPeopleData,
    } = OrganizationService.buildHierarchyWithPeople(dataSet);
    setFullHierarchy(fullOrganizationHierarchy);
    setAllPeople(allPeopleData);

    const filterOptions: HierarchyFilterOptions = {
      currentUserId: userId,
      showOnlyTeam,
    };

    const {
      hierarchy: organizationHierarchy,
    } = OrganizationService.buildHierarchyWithPeople(dataSet, filterOptions);
    setHierarchy(organizationHierarchy);

    const {
      nodes: layoutNodes,
      edges: layoutEdges,
    } = LayoutService.createTreeLayout(
      organizationHierarchy,
      surveyUrl,
      handleSurveyClick,
      handleResponseClick,
      surveyResponses,
      userId,
      fullOrganizationHierarchy,
      allPeopleData
    );

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [
    dataSet,
    surveyUrl,
    userId,
    showOnlyTeam,
    surveyResponses,
    handleSurveyClick,
    handleResponseClick,
    setNodes,
    setEdges,
  ]);

  // Efekt do odbudowy layoutu przy zmianie danych
  React.useEffect(() => {
    if (
      dataSet?.sortedRecordIds?.length &&
      dataSet.sortedRecordIds.length > 0
    ) {
      buildLayout();
    }
  }, [buildLayout]);

  // Efekt do ładowania odpowiedzi z ankiet
  React.useEffect(() => {
    if (
      surveyResponsesDataSet?.sortedRecordIds?.length &&
      surveyResponsesDataSet.sortedRecordIds.length > 0
    ) {
      const responses = OrganizationService.processSurveyResponses(
        surveyResponsesDataSet,
        surveyId
      );
      setSurveyResponses(responses);
    } else {
      setSurveyResponses([]);
    }
  }, [surveyResponsesDataSet, surveyId]);

  // Toggle filtrowania zespołu
  const toggleTeamFilter = React.useCallback(() => {
    setShowOnlyTeam(!showOnlyTeam);
  }, [showOnlyTeam]);

  // Renderowanie informacji o filtrze
  const renderFilterInfo = () => {
    if (userId) {
      if (showOnlyTeam) {
        // Znajdź użytkownika po ag_userid z obsługą różnych formatów GUID
        let currentUser = allPeople.find(
          (person) => person.ag_userid === userId
        );

        // Jeśli nie znaleziono, spróbuj oczyszczony format GUID
        if (!currentUser && userId) {
          const cleanUserId = userId.replace(/[{}-]/g, "").toLowerCase();
          currentUser = allPeople.find((person) => {
            if (!person.ag_userid) return false;
            const cleanAgUserId = person.ag_userid
              .replace(/[{}-]/g, "")
              .toLowerCase();
            return cleanAgUserId === cleanUserId;
          });
        }

        return (
          <Text className={styles.filterInfo}>
            Widok zespołu: {currentUser?.name ?? "Nieznany użytkownik"}
          </Text>
        );
      } else {
        return (
          <Text className={styles.filterInfo}>
            Pełna hierarchia organizacyjna
          </Text>
        );
      }
    }

    return (
      <Text className={styles.filterInfo}>
        Hierarchia organizacyjna (brak identyfikatora użytkownika)
      </Text>
    );
  };

  if (!dataSet?.sortedRecordIds?.length) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div className={styles.container}>
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

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.container}>
        <div className={styles.reactFlowWrapper}>
          <ReactFlowProvider>
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
              fitView
              fitViewOptions={{
                padding: 0.1,
                minZoom: 0.1,
                maxZoom: 1.5,
              }}
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Background />

              <Panel position="top-left" className={styles.panel}>
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
              </Panel>

              <Panel
                position="top-left"
                className={styles.panel}
                style={{
                  top: 180,
                  left: -14,
                  background: "transparent",
                  border: "lightgray",
                  padding: 0,
                }}
              >
                <Controls />
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </FluentProvider>
  );
};
