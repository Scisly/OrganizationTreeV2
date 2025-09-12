import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

/**
 * Styles for OrganizationTree component and its sub-components
 */
export const useOrganizationTreeStyles = makeStyles({
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
