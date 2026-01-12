# CLAUDE.MD - OrganizationTreeV2 Project Guide

## Project Overview

**OrganizationTreeV2** is a Power Apps Component Framework (PCF) control that visualizes organizational hierarchies with integrated survey management. It displays employee reporting structures as an interactive tree diagram with real-time survey response tracking.

**Technology Stack:**
- Power Apps Component Framework (PCF)
- React 17.0.2 + TypeScript 5.8.3
- ReactFlow 11.11.4 (interactive diagrams)
- Dagre 0.8.5 (graph layout)
- Fluent UI 9.46.2 (Microsoft design system)

**Language:** Polish UI

---

## Project Structure

```
OrganizationTreeV2/
├── OrganizationTreeV2/           # Main PCF control source
│   ├── components/               # React components
│   │   ├── OrganizationTree.tsx  # Main component (1055 lines)
│   │   └── PersonNode.tsx        # Employee card component
│   ├── services/                 # Business logic
│   │   ├── OrganizationService.ts # Hierarchy & filtering
│   │   └── LayoutService.ts      # Graph layout (Dagre)
│   ├── types/
│   │   └── OrganizationTypes.ts  # Core TypeScript interfaces
│   ├── ControlManifest.Input.xml # PCF manifest
│   └── index.ts                  # PCF entry point
├── types/                        # Global type declarations
│   └── reactflow-css.d.ts
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── eslint.config.mjs             # ESLint flat config
├── DATABASE_SCHEMA.md            # Data model documentation
├── README.md                     # Feature documentation
└── OrganizationTreeV2.pcfproj   # MSBuild project
```

---

## Core Files & Their Responsibilities

### Entry Point
- **`index.ts`** - PCF control implementation
  - Implements ComponentFramework.ReactControl interface
  - Manages 3 datasets: Organization, Surveys, Survey Responses
  - Handles pagination (1500 records/page with 100ms delays)
  - Multi-level modal dialog navigation with fallbacks

### Main Components
- **`OrganizationTree.tsx`** - Primary UI component (1055 lines)
  - Three-column layout: Tree (70%) | Surveys (15%) | Description (15%)
  - State management for hierarchy, surveys, filters, search
  - Full/Team view toggle with auto-detection of current user
  - Search/filter with recursive hierarchy preservation
  - Tree collapse/expand functionality

- **`PersonNode.tsx`** - Employee card component
  - Displays: name, position, email
  - Visual survey status (green glow = responded, red glow = not responded)
  - Action buttons: "Open Survey" or "View Responses"
  - Uses @codaworks/react-glow for visual effects

### Business Logic
- **`OrganizationService.ts`** - Core data processing
  - `buildHierarchyWithPeople()` - Creates tree from flat data
  - `filterByUserId()` - Isolates current user's team
  - `processSurveyResponses()` - Filters responses by survey
  - `buildSubordinatesHierarchy()` - Recursive tree builder
  - GUID normalization (handles formats with/without braces)
  - Circular hierarchy protection with visited set tracking

- **`LayoutService.ts`** - Graph visualization
  - Uses Dagre for automatic positioning
  - Node size: 220px × 140px
  - Rank separation: 80px, Node separation: 60px
  - Functions: `createTreeLayout()`, `flattenHierarchy()`, `getCenterPosition()`

### Type Definitions
- **`OrganizationTypes.ts`** - Core interfaces
  - `OrganizationPerson` - Employee with hierarchy
  - `OrganizationNode` - ReactFlow node wrapper
  - `OrganizationEdge` - Connection between employees
  - `Survey` - Survey metadata
  - `SurveyResponse` - Response tracking

---

## Architecture

```
Power Apps PCF Control (index.ts)
    │
    ├── 3 Datasets: Organization, Surveys, Responses
    │
    ▼
OrganizationTree (React)
    │
    ├─► OrganizationService → Hierarchy building & filtering
    ├─► LayoutService → Dagre graph positioning
    └─► ReactFlow Canvas → PersonNode components
```

**Design Patterns:**
- Service Layer Pattern (OrganizationService, LayoutService)
- React Hooks (useState, useCallback, useEffect)
- Composition over Inheritance
- Multi-level fallback system for navigation

---

## Key Features

### Hierarchy Visualization
- Interactive tree with zoom, pan, drag controls
- Automatic layout using Dagre algorithm
- Collapsible/expandable team branches
- Two views: Full org hierarchy or Current user's team

### Survey Integration
- Three datasets: Organization + Surveys + Responses
- Survey selection with real-time description display
- Visual response indicators (glow effects)
- Modal dialog for viewing responses (multi-level fallback)

### Search & Filtering
- Full-text search by employee name
- Recursive filtering (preserves parent-child relationships)
- Dynamic result count
- Team/Full view toggle

### Employee Cards
- Name, position, email display
- Survey status with visual glow
- Context-aware action buttons
- Manager collapse/expand controls

---

## Data Flow

```
Power Apps → 3 Datasets
    ↓
OrganizationService.buildHierarchyWithPeople()
    ↓
LayoutService.createTreeLayout() + Dagre positioning
    ↓
ReactFlow Visualization → PersonNode components
```

**Dataset Details:**
1. **organizationDataSet** - Employee hierarchy with ag_managerid relationships
2. **surveysDataSet** - Survey list with descriptions (sorted alphabetically)
3. **surveyResponsesDataSet** - Response tracking by employee + survey

---

## Important Technical Details

### GUID Handling
- Normalizes both formats:
  - `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`
  - `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Used for ag_userid matching in team detection

### Pagination
- Default: 1500 records per dataset
- Auto-loads multiple pages with 100ms delays
- Prevents performance issues with large datasets

### Layout Dimensions
- Container: Auto-width × 768px height
- Three columns: 70% tree, 15% surveys, 15% description
- Responsive width calculation

### Modal Navigation Fallbacks
1. **Primary:** `Xrm.Navigation.navigateTo` (modern Dataverse API)
2. **Fallback 1:** `context.navigation.openForm` (PCF API)
3. **Fallback 2:** `window.open` with direct URL

### State Management
Key React state variables:
- `hierarchy` - Filtered/searchable org tree
- `fullHierarchy` - Complete unfiltered tree
- `selectedSurvey` - Currently selected survey
- `surveyResponses` - Responses for selected survey
- `collapsedNodeIds` - Collapsed tree nodes
- `searchText` - Search filter term

---

## Build & Development

### NPM Scripts
```bash
npm install              # Install dependencies
npm run build            # Production build
npm run start            # Development server
npm run start:watch      # Watch mode
npm run lint             # Code linting
npm run lint:fix         # Auto-fix linting
npm run clean            # Clean output
npm run rebuild          # Full rebuild
```

### Deployment
```bash
pac pcf push --publisher-prefix yourprefix
```

### Configuration
- **Output:** `/out/controls/` (pcfconfig.json)
- **TypeScript:** Extends pcf-scripts base config
- **ESLint:** Flat config format (v9+)

---

## Dependencies

### Production
- `@fluentui/react-components` 9.46.2 - UI components
- `@fluentui/react-icons` 2.0.239 - Icon library
- `@codaworks/react-glow` 1.0.6 - Glow effects
- `reactflow` 11.11.4 - Interactive diagrams
- `dagre` 0.8.5 - Graph layout algorithm
- `react-dom` 17.0.2 - React rendering

### Development
- `typescript` 5.8.3 - Type checking
- `@microsoft/eslint-plugin-power-apps` 0.2.51 - Power Apps linting
- `typescript-eslint` 8.31.0 - ESLint TypeScript support
- `pcf-scripts` & `pcf-start` 1 - PCF build tools

---

## Documentation Files

- **README.md** - Feature documentation and usage guide
- **DATABASE_SCHEMA.md** - Data model, field mappings, ER diagram, SQL views
- **ControlManifest.Input.xml** - PCF configuration and dataset declarations

---

## Code Style & Conventions

### TypeScript
- Limited use of generics (simplified approach)
- Strict type checking enabled
- Interface-based type definitions

### React
- Functional components with hooks
- CSS-in-JS via Fluent UI makeStyles (no CSS files)
- Component composition pattern

### Naming
- Pascal case for components: `OrganizationTree`, `PersonNode`
- Camel case for functions: `buildHierarchy`, `filterByUserId`
- Interfaces match data entities: `OrganizationPerson`, `Survey`

### Polish UI
- All user-facing text in Polish
- Consistent Fluent UI terminology

---

## Testing

**Current Status:** No dedicated testing framework

**To Add Testing:**
1. Install Jest + ts-jest for TypeScript
2. Add React Testing Library for component tests
3. Mock Dataverse dataset objects for PCF testing

---

## Known Technical Considerations

### Performance
- Handles up to 1500 records per dataset efficiently
- Pagination prevents initial load issues
- Dagre layout optimized for typical org sizes (up to 500 employees)

### Browser Compatibility
- Targets modern browsers (PCF requirement)
- Depends on Power Apps portal runtime

### Security
- Respects Dataverse security roles
- No direct data persistence (read-only visualization)
- Modal navigation uses platform security context

---

## Common Development Tasks

### Adding New Features
1. Review `OrganizationTree.tsx` for UI changes
2. Update `OrganizationService.ts` for data logic
3. Modify `OrganizationTypes.ts` for new interfaces
4. Update `ControlManifest.Input.xml` for dataset changes
5. Test with `npm run build` and `pac pcf push`

### Modifying Layout
- Edit `LayoutService.ts` for positioning changes
- Adjust Dagre parameters (node size, separation)
- Update ReactFlow viewport settings in `OrganizationTree.tsx`

### Updating Styling
- Modify Fluent UI makeStyles in components
- Adjust theme tokens via `webLightTheme`
- Update glow effects in `PersonNode.tsx`

### Debugging
- Check browser console for PCF lifecycle logs
- Verify dataset binding in Power Apps form
- Test navigation fallbacks in different environments

---

## Git Workflow

**Current Branch:** `claude/update-claude-md-vn3Ux`

**Important:**
- All development on `claude/*` branches
- Branch name must match session ID for push to work
- Push with: `git push -u origin <branch-name>`
- Retry network failures with exponential backoff (2s, 4s, 8s, 16s)

---

## Version History Highlights

Recent commits (from git log):
- b87c888 - Integrate search functionality into hierarchy filtering
- 2cc0b66 - Sort surveys alphabetically and refactor initialization logic
- 910da07 - Display search results in filter information
- 00e82dd - Adjust layout and pass search props to ReactFlowContent
- 4771872 - Merge branch 'main' into OrganizationTreeV2-Code-Refactor-+-Prettier

---

## Contact & Support

For questions about:
- **PCF Framework:** Microsoft Power Apps documentation
- **ReactFlow:** https://reactflow.dev/
- **Fluent UI:** https://react.fluentui.dev/

---

*Last Updated: 2026-01-12*
*This document is auto-generated for Claude AI assistance*
