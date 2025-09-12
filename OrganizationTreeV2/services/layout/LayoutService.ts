import * as dagre from "dagre";
import {
  OrganizationPerson,
  OrganizationNode,
  OrganizationEdge,
  SurveyResponse,
  SelectedSurvey,
} from "../../types/OrganizationTypes";
import { LAYOUT_CONSTANTS } from "../utils/constants";
import { OrganizationService } from "../data/OrganizationService";

export class LayoutService {
  /**
   * Tworzy layout drzewa organizacyjnego używając Dagre
   */
  public static createTreeLayout(
    hierarchy: OrganizationPerson[],
    onSurveyClick: (personId: string) => void,
    onResponseClick: (responseId: string) => void,
    surveyResponses: SurveyResponse[],
    selectedSurvey?: SelectedSurvey,
    userId?: string,
    fullHierarchy?: OrganizationPerson[],
    allPeople?: OrganizationPerson[],
  ): { nodes: OrganizationNode[]; edges: OrganizationEdge[] } {
    const dagreGraph = new dagre.graphlib.Graph();

    // Konfiguracja grafu
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "TB", // Top to Bottom
      ranksep: LAYOUT_CONSTANTS.RANK_SEPARATION,
      nodesep: LAYOUT_CONSTANTS.NODE_SEPARATION,
      edgesep: LAYOUT_CONSTANTS.EDGE_SEPARATION,
      marginx: LAYOUT_CONSTANTS.MARGIN_X,
      marginy: LAYOUT_CONSTANTS.MARGIN_Y,
    });

    const nodes: OrganizationNode[] = [];
    const edges: OrganizationEdge[] = [];

    // Płaska lista wszystkich osób z hierarchii - używaj OrganizationService.flattenHierarchy
    const hierarchyPeople = OrganizationService.flattenHierarchy(hierarchy);

    // Dodawanie węzłów do grafu Dagre
    hierarchyPeople.forEach((person) => {
      dagreGraph.setNode(person.id, {
        width: LAYOUT_CONSTANTS.NODE_WIDTH,
        height: LAYOUT_CONSTANTS.NODE_HEIGHT,
      });
    });

    // Dodawanie krawędzi do grafu Dagre
    hierarchyPeople.forEach((person) => {
      if (person.children && person.children.length > 0) {
        person.children.forEach((child) => {
          dagreGraph.setEdge(person.id, child.id);

          edges.push({
            id: `${person.id}-${child.id}`,
            source: person.id,
            target: child.id,
            type: "smoothstep",
          });
        });
      }
    });

    // Uruchomienie layoutu Dagre
    dagre.layout(dagreGraph);

    // Tworzenie węzłów ReactFlow z pozycjami z Dagre
    hierarchyPeople.forEach((person) => {
      const nodeWithPosition = dagreGraph.node(person.id);

      // Znajdź odpowiedź dla tej osoby
      const surveyResponse = surveyResponses.find(
        (response) => response.personId === person.id,
      );

      nodes.push({
        id: person.id,
        type: "person",
        position: {
          x: nodeWithPosition.x - LAYOUT_CONSTANTS.NODE_WIDTH / 2,
          y: nodeWithPosition.y - LAYOUT_CONSTANTS.NODE_HEIGHT / 2,
        },
        data: {
          person,
          selectedSurvey,
          onSurveyClick,
          onResponseClick,
          surveyResponse,
          userId,
          fullHierarchy: fullHierarchy ?? hierarchy,
          allPeople: allPeople ?? hierarchyPeople,
        },
      });
    });

    return { nodes, edges };
  }

  /**
   * Automatyczne centrowanie widoku
   */
  public static getCenterPosition(nodes: OrganizationNode[]): {
    x: number;
    y: number;
  } {
    if (nodes.length === 0) return { x: 0, y: 0 };

    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + LAYOUT_CONSTANTS.NODE_WIDTH),
        maxY: Math.max(
          acc.maxY,
          node.position.y + LAYOUT_CONSTANTS.NODE_HEIGHT,
        ),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
}
