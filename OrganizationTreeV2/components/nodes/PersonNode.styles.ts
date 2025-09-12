import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

/**
 * Styles for PersonNode component
 */
export const usePersonNodeStyles = makeStyles({
  card: {
    width: "220px",
    minHeight: "120px",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow8,
    position: "relative",
    "&:hover": {
      boxShadow: tokens.shadow16,
    },
  },
  surveyIndicator: {
    width: "20px !important",
    height: "20px !important",
    borderRadius: "50% !important",
    marginLeft: "0px",
    flexShrink: 0,
    position: "relative",
    display: "block !important",
    border: "none !important",
    outline: "none !important",
    overflow: "visible !important",
    minWidth: "20px !important",
    minHeight: "20px !important",
    maxWidth: "20px !important",
    maxHeight: "20px !important",
    borderTopLeftRadius: "50% !important",
    borderTopRightRadius: "50% !important",
    borderBottomLeftRadius: "50% !important",
    borderBottomRightRadius: "50% !important",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    WebkitBorderRadius: "50%",
    MozBorderRadius: "50%",
    backgroundColor: "var(--survey-indicator-bg, #EF4444)",
    "&.responded": {
      backgroundColor: "#10B981 !important", // Emerald-500
    },
    "&.notResponded": {
      backgroundColor: "#EF4444 !important", // Red-500
    },
    "&::before": {
      display: "none !important",
    },
    "&::after": {
      display: "none !important",
    },
  },
  glowWrapper: {
    borderRadius: "50% !important",
    overflow: "visible !important",
    display: "inline-block",
  },
  cardHeader: {
    ...shorthands.padding("8px", "12px"),
    display: "flex",
    alignItems: "center",
    "& .fui-CardHeader__header": {
      display: "flex",
      alignItems: "center",
      flex: 1,
    },
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  cardContent: {
    ...shorthands.padding("0px", "12px", "12px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
  },
  personName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  position: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  email: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  surveyButton: {
    marginTop: "8px",
    width: "100%",
    pointerEvents: "auto",
    position: "relative",
    zIndex: 10,
  },
  handle: {
    width: "8px",
    height: "8px",
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border("2px", "solid", tokens.colorNeutralBackground1),
  },
});
