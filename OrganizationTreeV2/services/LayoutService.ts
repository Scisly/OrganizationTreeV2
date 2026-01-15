import * as dagre from "dagre";
import {
  OrganizationPerson,
  OrganizationNode,
  OrganizationEdge,
  SurveyResponse,
  SelectedSurvey,
  UserContext,
  Survey,
} from "../types/OrganizationTypes";

export class LayoutService {
  private static readonly NODE_WIDTH = 253; // Zwiększone o 15% (220 * 1.15)
  private static readonly NODE_HEIGHT = 161; // Zwiększone o 15% (140 * 1.15)
  private static readonly RANK_SEPARATION = 80;
  private static readonly NODE_SEPARATION = 60;

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
    userContext?: UserContext,
    allSurveyResponses?: SurveyResponse[],
    surveys?: Survey[]
  ): { nodes: OrganizationNode[]; edges: OrganizationEdge[] } {
    const dagreGraph = new dagre.graphlib.Graph();

    // Konfiguracja grafu
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "TB", // Top to Bottom
      ranksep: this.RANK_SEPARATION,
      nodesep: this.NODE_SEPARATION,
      edgesep: 10,
      marginx: 20,
      marginy: 20,
    });

    const nodes: OrganizationNode[] = [];
    const edges: OrganizationEdge[] = [];

    // Płaska lista wszystkich osób z hierarchii
    const hierarchyPeople = this.flattenHierarchy(hierarchy);

    // Dodawanie węzłów do grafu Dagre
    hierarchyPeople.forEach((person) => {
      dagreGraph.setNode(person.id, {
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT,
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
        (response) => response.personId === person.id
      );

      nodes.push({
        id: person.id,
        type: "person",
        position: {
          x: nodeWithPosition.x - this.NODE_WIDTH / 2,
          y: nodeWithPosition.y - this.NODE_HEIGHT / 2,
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
          userContext,
          allSurveyResponses,
          surveys,
        },
      });
    });

    return { nodes, edges };
  }

  /**
   * Konwertuje hierarchię do płaskiej listy
   */
  private static flattenHierarchy(
    hierarchy: OrganizationPerson[]
  ): OrganizationPerson[] {
    const result: OrganizationPerson[] = [];

    const flatten = (people: OrganizationPerson[]) => {
      people.forEach((person) => {
        result.push(person);
        if (person.children && person.children.length > 0) {
          flatten(person.children);
        }
      });
    };

    flatten(hierarchy);
    return result;
  }

  /**
   * Automatyczne centrowanie widoku
   */
  public static getCenterPosition(
    nodes: OrganizationNode[]
  ): { x: number; y: number } {
    if (nodes.length === 0) return { x: 0, y: 0 };

    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + this.NODE_WIDTH),
        maxY: Math.max(acc.maxY, node.position.y + this.NODE_HEIGHT),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
}
