import * as React from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useReactFlow,
  ConnectionMode,
  Panel,
  NodeChange,
  EdgeChange,
} from "reactflow";
import { Button } from "@fluentui/react-components";
import { Filter20Regular, Organization20Regular } from "@fluentui/react-icons";
import { PersonNode } from "../nodes/PersonNode";
import { OrganizationPerson } from "../../types/OrganizationTypes";
import { useOrganizationTreeStyles } from "../core/OrganizationTree.styles";

// Available node types for ReactFlow
const nodeTypes = {
  person: PersonNode,
};

export interface ReactFlowContentProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  userId?: string;
  showOnlyTeam: boolean;
  allPeople: OrganizationPerson[];
  hierarchy: OrganizationPerson[];
  toggleTeamFilter: () => void;
  renderFilterInfo: () => React.ReactElement;
}

/**
 * Internal component with ReactFlow hooks and logic
 */
export const ReactFlowContent: React.FC<ReactFlowContentProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  userId,
  showOnlyTeam,
  toggleTeamFilter,
  renderFilterInfo,
}) => {
  const styles = useOrganizationTreeStyles();
  const reactFlowInstance = useReactFlow();

  // Auto fitView after loading nodes
  React.useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.1,
          minZoom: 0.1,
          maxZoom: 1.5,
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [reactFlowInstance, nodes.length]);

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
      fitView
      fitViewOptions={{
        padding: 0.1,
        minZoom: 0.1,
        maxZoom: 1.5,
      }}
      minZoom={0.1}
      maxZoom={2}
      style={{ width: "100%", height: "100%" }}
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
  );
};
