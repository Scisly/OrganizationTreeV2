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
  Card,
  CardHeader,
  CardPreview,
  Input,
} from "@fluentui/react-components";
import { PersonNode } from "./PersonNode";
import { OrganizationService } from "../services/OrganizationService";
import { LayoutService } from "../services/LayoutService";
import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
  Survey,
  SelectedSurvey,
} from "../types/OrganizationTypes";
import { CommentText16Filled, Document20Regular, Filter20Regular, Organization20Regular, Poll20Regular, TextDescription20Regular, Checkmark16Filled, Checkmark16Regular } from "@fluentui/react-icons";

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
    minWidth: "0", // Prevents flex item from overflowing
    height: "100%",
  },
  reactFlowContainer: {
    width: "100%",
    height: "100%",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  surveyPanel: {
    minWidth: "200px",
    height: "100%",
    overflow: "auto",
    ...shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  descriptionPanel: {
    minWidth: "200px",
    height: "100%",
    overflow: "auto",
    ...shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  surveyPanelHeader: {
    ...shorthands.padding("12px"),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  descriptionPanelHeader: {
    ...shorthands.padding("12px"),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  surveyList: {
    flex: "1 1 auto",
    ...shorthands.padding("8px"),
    ...shorthands.overflow("auto"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
  },
  descriptionContent: {
    flex: "1 1 auto",
    ...shorthands.padding("12px"),
    ...shorthands.overflow("auto"),
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
  surveyItem: {
    ...shorthands.padding("8px"),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  surveyItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.border("1px", "solid", tokens.colorBrandStroke1),
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  surveyCardHeader: {
    position: "relative",
  },
  selectedSurveyIcon: {
    color: tokens.colorBrandForeground1,
  },
  surveyHeaderWithIcon: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
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
  searchInput: {
    width: "250px",
  },
});

// Fixed height constant
const FIXED_HEIGHT = 768;

// Typy węzłów dostępne w ReactFlow
const nodeTypes = {
  person: PersonNode,
};

// Komponent wewnętrzny z ReactFlow hookami
const ReactFlowContent: React.FC<{
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  styles: ReturnType<typeof useStyles>;
  userId?: string;
  showOnlyTeam: boolean;
  allPeople: OrganizationPerson[];
  hierarchy: OrganizationPerson[];
  toggleTeamFilter: () => void;
  renderFilterInfo: () => React.ReactElement;
  onInit: (instance: ReturnType<typeof useReactFlow>) => void;
  searchText: string;
  handleSearchChange: (text: string) => void;
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
}) => {
  const reactFlowInstance = useReactFlow();

  // Auto fitView po załadowaniu węzłów z lepszą logiką wyśrodkowania
  React.useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Użyj większego opóźnienia aby upewnić się, że węzły są w pełni wyrenderowane
      const timeoutId = setTimeout(() => {
        // Najpierw sprawdź czy wszystkie węzły mają prawidłowe pozycje
        const nodesWithValidPositions = nodes.filter(
          node => node.position.x !== undefined && node.position.y !== undefined
        );
        
        if (nodesWithValidPositions.length === nodes.length) {
          reactFlowInstance.fitView({
            padding: 0.2, // Zwiększ padding dla lepszego wyświetlania
            minZoom: 0.1,
            maxZoom: 1.2, // Zmniejsz maksymalne zoom dla lepszej czytelności
            duration: 800, // Dodaj animację
          });
        }
      }, 300); // Zwiększ opóźnienie do 300ms
      return () => clearTimeout(timeoutId);
    }
  }, [reactFlowInstance, nodes.length]);

  // Dodatkowy effect dla zapewnienia wyśrodkowania po pełnym załadowaniu
  React.useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Sprawdź czy ReactFlow jest gotowy i czy węzły są widoczne
      const checkAndCenter = () => {
        const viewport = reactFlowInstance.getViewport();
        const bounds = reactFlowInstance.getNodes().reduce(
          (acc, node) => {
            const nodeWithDimensions = reactFlowInstance.getNode(node.id);
            if (nodeWithDimensions) {
              return {
                minX: Math.min(acc.minX, nodeWithDimensions.position.x),
                minY: Math.min(acc.minY, nodeWithDimensions.position.y),
                maxX: Math.max(acc.maxX, nodeWithDimensions.position.x + 220),
                maxY: Math.max(acc.maxY, nodeWithDimensions.position.y + 140),
              };
            }
            return acc;
          },
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        // Jeśli bounds są prawidłowe, wyśrodkuj widok
        if (bounds.minX !== Infinity && bounds.maxX !== -Infinity) {
          reactFlowInstance.fitView({
            padding: 0.2,
            minZoom: 0.1,
            maxZoom: 1.2,
            duration: 500,
          });
        }
      };

      // Opóźnienie aby upewnić się, że DOM jest gotowy
      const finalTimeoutId = setTimeout(checkAndCenter, 500);
      return () => clearTimeout(finalTimeoutId);
    }
  }, [reactFlowInstance, nodes]);

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
      fitView
      fitViewOptions={{
        padding: 0.2,
        minZoom: 0.1,
        maxZoom: 1.2,
        includeHiddenNodes: false,
      }}
      minZoom={0.1}
      maxZoom={2}
      style={{ width: '100%', height: '100%' }}
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
            style={{ width: '100%' }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(event.target.value)}
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
  projectId,
  userId,
  containerWidth,
  onSurveyClick,
  onResponseClick,
  onSurveyChange,
}) => {
  const styles = useStyles();
  
  // Calculate responsive dimensions based on containerWidth
  const actualContainerWidth = containerWidth ?? 1600; // fallback to default
  const RESPONSIVE_CONTAINER_WIDTH = actualContainerWidth - 2; // subtract 2px margin
  const RESPONSIVE_TREE_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.70) - 2;
  const RESPONSIVE_LIST_WIDTH = Math.floor(RESPONSIVE_CONTAINER_WIDTH * 0.15) - 2;
  const RESPONSIVE_DESC_WIDTH = RESPONSIVE_CONTAINER_WIDTH - RESPONSIVE_TREE_WIDTH - RESPONSIVE_LIST_WIDTH - 2;
  
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
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = React.useState<SelectedSurvey | null>(null);
  const [isLoadingAllData, setIsLoadingAllData] = React.useState(false);
  const [searchText, setSearchText] = React.useState<string>("");

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
      if (selectedSurvey?.url) {
        const fullSurveyUrl = `${selectedSurvey.url}&ctx=%7B"personId"%3A"${personId}"%7D`;
        onSurveyClick(personId, fullSurveyUrl);
      }
    },
    [selectedSurvey?.url, onSurveyClick]
  );

  // Budowanie hierarchii i layoutu
  const handleResponseClick = React.useCallback(
    (responseId: string) => {
      if (onResponseClick) {
        onResponseClick(responseId);
      }
    },
    [onResponseClick]
  );

  // Handler dla wyszukiwania
  const handleSearchChange = React.useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Funkcja filtrowania osób po imieniu i nazwisku
  const filterPeopleByName = React.useCallback((people: OrganizationPerson[], searchTerm: string): OrganizationPerson[] => {
    if (!searchTerm.trim()) {
      return people;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filterRecursive = (personList: OrganizationPerson[]): OrganizationPerson[] => {
      const filtered: OrganizationPerson[] = [];
      
      for (const person of personList) {
        const fullName = `${person.name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTermLower);
        
        // Filtruj dzieci rekurencyjnie
        const filteredChildren = person.children ? filterRecursive(person.children) : [];
        
        // Dodaj osobę jeśli ona sama pasuje do wyszukiwania lub ma dzieci które pasują
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
  }, []);

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
    
    // Zastosuj filtrowanie po nazwie jeśli tekst wyszukiwania nie jest pusty
    const filteredHierarchy = filterPeopleByName(organizationHierarchy, searchText);
    setHierarchy(filteredHierarchy);

    const {
      nodes: layoutNodes,
      edges: layoutEdges,
    } = LayoutService.createTreeLayout(
      filteredHierarchy,
      handleSurveyClick,
      handleResponseClick,
      surveyResponses,
      selectedSurvey ?? undefined,
      userId,
      fullOrganizationHierarchy,
      allPeopleData
    );

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [
    dataSet,
    selectedSurvey,
    userId,
    showOnlyTeam,
    surveyResponses,
    searchText,
    handleSurveyClick,
    handleResponseClick,
    filterPeopleByName,
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
      surveyResponsesDataSet.sortedRecordIds.length > 0 &&
      selectedSurvey?.id
    ) {
      const responses = OrganizationService.processSurveyResponses(
        surveyResponsesDataSet,
        selectedSurvey.id
      );
      setSurveyResponses(responses);
    } else {
      setSurveyResponses([]);
    }
  }, [surveyResponsesDataSet, selectedSurvey?.id]);

  // Ładowanie listy ankiet
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
      
      // Sortowanie ankiet alfabetycznie według nazwy
      const sortedSurveys = loadedSurveys.sort((a, b) => {
        const nameA = a.msfp_name?.toLowerCase() || '';
        const nameB = b.msfp_name?.toLowerCase() || '';
        return nameA.localeCompare(nameB, 'pl', { sensitivity: 'accent' });
      });
      
      setSurveys(sortedSurveys);
      
      // Automatycznie wybierz pierwszą ankietę jeśli nie ma wybranej
      if (loadedSurveys.length > 0 && !selectedSurvey) {
        const firstSurvey = {
          id: loadedSurveys[0].msfp_surveyid,
          name: loadedSurveys[0].msfp_name,
          url: loadedSurveys[0].msfp_surveyurl ?? "",
          description: loadedSurveys[0].msfp_description ?? "",
        };
        setSelectedSurvey(firstSurvey);
        
        // Wywołaj callback przy automatycznym wyborze
        if (onSurveyChange) {
          onSurveyChange();
        }
      }
    } else {
      setSurveys([]);
      setSelectedSurvey(null);
    }
  }, [surveysDataSet, selectedSurvey]);

  // Toggle filtrowania zespołu
  const toggleTeamFilter = React.useCallback(() => {
    setShowOnlyTeam(!showOnlyTeam);
  }, [showOnlyTeam]);

  // Handler dla inicjalizacji ReactFlow
  const handleReactFlowInit = React.useCallback((instance: ReturnType<typeof useReactFlow>) => {
    console.log('ReactFlow initialized');
    // Wyśrodkuj widok od razu po inicjalizacji
    if (nodes.length > 0) {
      setTimeout(() => {
        instance.fitView({
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.2,
          duration: 300,
        });
      }, 100);
    }
  }, [nodes.length]);

  // Obsługa wyboru ankiety
  const handleSurveySelect = React.useCallback((survey: Survey) => {
    const newSelectedSurvey = {
      id: survey.msfp_surveyid,
      name: survey.msfp_name,
      url: survey.msfp_surveyurl ?? "",
      description: survey.msfp_description ?? "",
    };
    setSelectedSurvey(newSelectedSurvey);
    
    // Wywołaj callback do wymuszenia odświeżenia widoku
    if (onSurveyChange) {
      onSurveyChange();
    }
  }, [onSurveyChange]);

  // Renderowanie informacji o filtrze
  const renderFilterInfo = () => {
    const totalFilteredNodes = nodes.length;
    const searchInfo = searchText.trim() 
      ? ` (znaleziono: ${totalFilteredNodes})` 
      : '';

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
            Widok zespołu: {currentUser?.name ?? "Nieznany użytkownik"}{searchInfo}
          </Text>
        );
      } else {
        return (
          <Text className={styles.filterInfo}>
            Pełna hierarchia organizacyjna{searchInfo}
          </Text>
        );
      }
    }

    return (
      <Text className={styles.filterInfo}>
        Hierarchia organizacyjna (brak identyfikatora użytkownika){searchInfo}
      </Text>
    );
  };

  if (!dataSet?.sortedRecordIds?.length) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div 
          className={styles.container}
          style={{
            width: `${RESPONSIVE_CONTAINER_WIDTH}px`,
            height: `768px`,
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

  return (
    <FluentProvider theme={webLightTheme}>
      <div 
        className={styles.container}
        style={{
          width: `${RESPONSIVE_CONTAINER_WIDTH}px`,
          height: `768px`,
        }}
      >
        {/* Główna kolumna - drzewo organizacyjne (70%) */}
        <div 
          className={styles.mainContent}
          style={{
            width: `${RESPONSIVE_TREE_WIDTH}px`,
            height: `768px`,
          }}
        >
          <div 
            className={styles.reactFlowContainer}
            style={{
              width: `${RESPONSIVE_TREE_WIDTH}px`,
              height: `768px`,
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
                  allPeople={allPeople}
                  hierarchy={hierarchy}
                  toggleTeamFilter={toggleTeamFilter}
                  renderFilterInfo={renderFilterInfo}
                />
              </ReactFlowProvider>
            </div>
          </div>
        </div>
        
        {/* Kolumna ankiet (15%) */}
        <div 
          className={styles.surveyPanel}
          style={{
            width: `${RESPONSIVE_LIST_WIDTH}px`,
            height: `768px`,
          }}
        >
          <div className={styles.surveyPanelHeader}>
            <Poll20Regular />
            <Text weight="semibold">Ankiety ({surveys.length})</Text>
          </div>
          <div className={styles.surveyList}>
            {surveys.length === 0 ? (
              <Text>Brak dostępnych ankiet</Text>
            ) : (
              surveys.map((survey) => {
                const isSelected = selectedSurvey?.id === survey.msfp_surveyid;
                return (
                  <Card
                    key={survey.msfp_surveyid}
                    className={`${styles.surveyItem} ${
                      isSelected ? styles.surveyItemSelected : ""
                    }`}
                    onClick={() => handleSurveySelect(survey)}
                    appearance="subtle"
                  >
                    <div className={styles.surveyCardHeader}>
                      <CardHeader
                        header={
                          <div className={styles.surveyHeaderWithIcon}>
                            {isSelected && (
                              <Checkmark16Regular className={styles.selectedSurveyIcon} />
                            )}
                            <Text weight={isSelected ? "bold" : "medium"}>
                              {survey.msfp_name}
                            </Text>
                          </div>
                        }
                      />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Nowa kolumna - opis ankiety (15%) */}
        <div 
          className={styles.descriptionPanel}
          style={{
            width: `${RESPONSIVE_DESC_WIDTH}px`,
            height: `768px`,
          }}
        >
          <div className={styles.descriptionPanelHeader}>
            <TextDescription20Regular />
            <Text weight="semibold">Opis ankiety</Text>
          </div>
          <div className={styles.descriptionContent}>
            {selectedSurvey?.description ? (
              <Text weight="bold">{selectedSurvey.description}</Text>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground3 }}>
                Brak opisu dla wybranej ankiety
              </Text>
            )}
          </div>
        </div>
      </div>
    </FluentProvider>
  );
};
