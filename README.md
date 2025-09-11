# OrganizationTreeV2 - PCF Organizational Hierarchy Control with Survey Integration

## Description

An advanced PCF control that displays an interactive organizational hierarchy with full survey system integration. Built with ReactFlow, Dagre, and @codaworks/react-glow to create a professional interface with visual survey status indicators.

## Features

### 🌳 **Hierarchy Visualization**
- Interactive organizational chart in tree layout
- Automatic layout using Dagre algorithm
- Responsive nodes with employee information
- Zoom, panning, and ReactFlow navigation controls

### 👤 **Smart Employee Nodes**
- **Visual survey status indicators:**
  - 🟢 **Green indicator with glow effect** - employee responded to survey
  - 🔴 **Red indicator with glow effect** - employee hasn't responded to survey
  - ⚪ **Standard person icon** - employee outside user's team
- Display of name, position, and email
- **Smart action buttons:**
  - "Open Survey" - for people without responses
  - "View Responses" - for people with saved responses
- Tooltips with survey status information

### 🔍 **Filtering and Team Management**
- Full organizational hierarchy view
- "My Team Only" view for managers with automatic detection
- Dynamic switching between views
- Survey indicators and buttons only for team members

### 📊 **Triple Dataset Integration**
- **Surveys dataset**: Dynamic loading of Customer Voice surveys with project filtering
- **Organizational dataset**: Enhanced employee hierarchy with precise user identification (`ag_userid`)
- **Response dataset**: Real-time survey response tracking with completion status
- Automatic data linking across all three datasets with intelligent GUID matching
- Background pagination handling for large datasets (1500+ records per page)

### 🎯 **Multi-Survey Management**
- **Dynamic Survey Selection**: Interactive sidebar with real-time survey switching
- **Customer Voice Integration**: Direct integration with Microsoft Customer Voice projects
- **Context-Aware URLs**: Automatic person context injection for personalized survey experiences
- **Project Filtering**: Optional filtering of surveys by Customer Voice project ID
- **Visual Survey Cards**: Professional survey selection interface with metadata display

### ✨ **Visual Effects**
- Professional glow effects from @codaworks/react-glow library
- Fluent UI 9 design system for consistent appearance
- Responsive animations and transitions
- CSS overrides for full appearance control

## Architecture

### Components

#### **OrganizationTree** (Main component)
- Manages entire hierarchy state
- Handles filtering and layout
- Integrates ReactFlow with Fluent UI

#### **PersonNode** (Node component)
- Represents a single person in hierarchy
- Displays employee data card
- Handles actions (opening surveys)

### Services

#### **OrganizationService**
- Building hierarchical structure from flat data
- Data filtering by user roles
- Managing manager-subordinate relationships

#### **LayoutService**
- Creating layout using Dagre
- Positioning nodes and edges
- Centering and scaling view

### Types and Interfaces

```typescript
interface OrganizationPerson {
  id: string;
  name: string;
  position?: string;
  managerId?: string;
  email?: string;
  level?: number;
  children?: OrganizationPerson[];
}

interface SurveyResponse {
  id: string;
  person_id: string;
  survey_id: string;
  responseUrl: string;
  submittedDate?: Date;
}

interface PersonNodeData {
  person: OrganizationPerson;
  surveyUrl: string;
  onSurveyClick: (personId: string) => void;
  onResponseClick?: (responseUrl: string) => void;
  surveyResponse?: SurveyResponse;
  userId?: string;
  fullHierarchy: OrganizationPerson[];
  allPeople?: OrganizationPerson[];
  showSurveyButton?: boolean;
}
```

## Configuration

### Manifest (ControlManifest.Input.xml)

```xml
<!-- Properties -->
<property name="projectId" display-name-key="Project_ID" 
          description-key="Customer Voice project ID for filtering surveys" 
          of-type="SingleLine.Text" usage="input" required="false" />

<!-- Dataset for surveys from Customer Voice -->
<data-set name="surveysDataSet" display-name-key="Surveys_Dataset">
  <property-set name="msfp_surveyid" display-name-key="Survey_ID" 
                description-key="Survey unique identifier" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="msfp_name" display-name-key="Survey_Name" 
                description-key="Survey name" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="msfp_surveyurl" display-name-key="Survey_URL" 
                description-key="Survey URL" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="msfp_projectid" display-name-key="Project_ID_Field" 
                description-key="Project ID for filtering" of-type="SingleLine.Text" 
                usage="bound" required="false" />
</data-set>

<!-- Dataset for organizational data -->
<data-set name="organizationDataSet" display-name-key="Organization_Dataset">
  <property-set name="id" display-name-key="Record_ID" 
                description-key="Unique identifier" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="name" display-name-key="Person_Name" 
                description-key="Person's name" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="position" display-name-key="Position_Title" 
                description-key="Job position" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="managerId" display-name-key="Manager_ID" 
                description-key="Manager's ID" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="email" display-name-key="Email" 
                description-key="Email address" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="ag_userid" display-name-key="User_ID" 
                description-key="User ID from system" of-type="SingleLine.Text" 
                usage="bound" required="false" />
</data-set>

<!-- Dataset for survey responses -->
<data-set name="surveyResponsesDataSet" display-name-key="Survey_Responses_Dataset">
  <property-set name="responseId" display-name-key="Response_ID" 
                description-key="Unique response identifier" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="survey_id" display-name-key="Survey_ID_Response" 
                description-key="Survey ID for filtering" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="personId" display-name-key="Person_ID_Response" 
                description-key="Person ID from organization dataset" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="responseUrl" display-name-key="Response_URL" 
                description-key="URL to view survey response" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="responseDate" display-name-key="Response_Date" 
                description-key="Date when survey was completed" of-type="DateAndTime.DateAndTime" 
                usage="bound" required="false" />
</data-set>
```

### Column Mapping in Power Apps

#### Surveys Dataset (surveysDataSet)
1. **msfp_surveyid** → Survey GUID from Customer Voice
2. **msfp_name** → Survey display name
3. **msfp_surveyurl** → Survey base URL for responses
4. **msfp_projectid** → Customer Voice project ID (for filtering)

#### Organizational Dataset (organizationDataSet)
1. **id** → Employee record GUID from employee table
2. **name** → Employee first and last name
3. **position** → Job title
4. **managerId** → Manager GUID (relation to the same view)
5. **email** → Email address
6. **ag_userid** → System User ID (GUID) for precise user identification

#### Response Dataset (surveyResponsesDataSet)
1. **responseId** → Response record GUID
2. **survey_id** → Survey GUID (foreign key to surveysDataSet)
3. **personId** → Person GUID (foreign key to organizationDataSet)
4. **responseUrl** → URL to view the specific response
5. **responseDate** → Date and time when survey was completed

## Installation and Usage

### 1. Build and Package

```bash
npm run build
pac pcf push --publisher-prefix yourprefix
```

### 2. Add to Solution

1. Add control to Power Platform solution
2. Publish solution

### 3. Configuration in Power Apps

#### In Form with OrganizationTreeV2 control:

1. Add OrganizationTreeV2 control
2. Configure properties:
   - **Project ID**: Customer Voice project ID (optional - for filtering surveys)
   - **Surveys Dataset**: View of available surveys from Customer Voice
   - **Organization Dataset**: Organization employee view with enhanced user identification
   - **Survey Responses Dataset**: Survey responses view with response tracking

3. Map dataset columns according to "Column Mapping" section

### 4. Table Structure

#### Surveys Table (Customer Voice Integration)
```sql
-- Direct integration with Customer Voice surveys table
SELECT 
    msfp_surveyid,
    msfp_name,
    msfp_surveyurl,
    msfp_projectid
FROM msfp_survey
WHERE statecode = 0  -- active surveys
AND msfp_projectid = @ProjectId  -- filter by project if specified
```

#### Employee Table (Enhanced Organization)
```sql
CREATE VIEW [Organization_View] AS
SELECT 
    employeeid as id,
    fullname as name,
    jobtitle as position,
    managerid as managerId,
    emailaddress as email,
    systemuserid as ag_userid  -- Enhanced: System User ID for precise identification
FROM employees e
INNER JOIN systemusers s ON e.emailaddress = s.internalemailaddress
WHERE e.statuscode = 1  -- active employees
```

#### Survey Responses Table (Enhanced Tracking)
```sql
CREATE VIEW [Survey_Responses_View] AS
SELECT 
    msfp_surveyresponseid as responseId,
    msfp_surveyid as survey_id,
    CASE 
        WHEN su.systemuserid IS NOT NULL THEN e.employeeid
        ELSE msfp_respondent  -- fallback to direct respondent ID
    END as personId,
    msfp_responseurl as responseUrl,
    createdon as responseDate
FROM msfp_surveyresponse sr
LEFT JOIN systemusers su ON sr.msfp_respondent = su.systemuserid
LEFT JOIN employees e ON su.internalemailaddress = e.emailaddress
WHERE sr.statecode = 0  -- active responses
```

## Advanced Features

### Customer Voice Integration

#### Dynamic Survey Management
- **Real-time Survey Loading**: Automatic discovery of surveys from Customer Voice projects
- **Project-based Filtering**: Surveys can be filtered by specific Customer Voice project ID
- **Interactive Survey Selection**: Users can switch between multiple surveys in real-time
- **Automatic URL Enhancement**: Survey URLs are enriched with person context for personalized experiences

#### Survey Context Enhancement
The control automatically enhances survey URLs with person context:

```
Original Survey URL: https://customervoice.microsoft.com/Pages/ResponsePage.aspx?id=ABC123
Enhanced URL: https://customervoice.microsoft.com/Pages/ResponsePage.aspx?id=ABC123&ctx=%7B"personId"%3A"employee-guid"%7D
```

This allows surveys to:
- Pre-populate respondent information
- Track responses by specific employees
- Customize survey questions based on employee data

### Hierarchy Filtering

The control automatically detects user's team based on enhanced user identification:

- **Enhanced User Matching**: Uses `ag_userid` field for precise user identification with GUID normalization
- **"All" View**: Full organizational hierarchy
- **"My Team Only" View**: Hierarchy from current user downward (their subordinates)
- **Smart Team Detection**: Handles various GUID formats for reliable user matching
- **Survey Indicators**: Displayed only for user's team members
- **Action Buttons**: Available only for team members

### Multi-Survey System Integration

#### Automatic Data Synchronization
- System automatically links data across three datasets: surveys, organization, and responses
- Real-time survey selection updates all visual indicators and response statuses
- Efficient data loading with automatic pagination for large datasets (1500+ records)
- Background data processing for optimal user experience

#### Visual Survey Management
- **Survey Selection Panel**: Dedicated 20% sidebar with interactive survey cards
- **Real-time Switching**: Instant survey context switching without page reload
- **Response Count Tracking**: Visual indicators show completion status per survey
- **Survey Metadata Display**: Shows survey name, selection status, and metadata

### Performance Optimizations

#### Smart Data Loading
- **Automatic Pagination**: Handles large datasets automatically (1500 records per page)
- **Background Processing**: Non-blocking data loading for smooth user experience
- **Memory Management**: Efficient React state management with proper cleanup
- **Optimized Re-rendering**: Strategic use of React.useCallback and React.useMemo

#### UI Performance
- **Fixed Dimensions**: Consistent 1600x768px layout prevents layout shifts
- **ReactFlow Optimization**: Proper node positioning and efficient edge rendering
- **Component Memoization**: Reduced unnecessary re-renders for better performance

### Enhanced User Experience

#### Responsive Design
- **Split-Panel Layout**: 80% hierarchy view + 20% survey management
- **Adaptive Sizing**: Automatic scaling for different screen sizes within fixed container
- **Touch-Friendly**: Optimized for both mouse and touch interactions
- **Keyboard Navigation**: Full keyboard accessibility support

#### Visual Feedback
- **Loading States**: Clear indicators during data loading operations
- **Empty States**: Informative messages when no data is available
- **Error Handling**: Graceful error handling with user-friendly messages
- **Success Indicators**: Clear visual feedback for successful operations

## Dependencies

### NPM Packages
```json
{
  "@fluentui/react-components": "9.46.2",
  "@fluentui/react-icons": "^2.0.239",
  "@codaworks/react-glow": "^1.0.6",
  "dagre": "^0.8.5",
  "@types/dagre": "^0.7.53",
  "reactflow": "^11.11.4",
  "react": "^17.0.2",
  "react-dom": "^17.0.2"
}
```

### Platform Libraries
- React 16.14.0
- Fluent UI 9.46.2

## Troubleshooting

### Customer Voice Integration Issues

### Issue: No surveys showing in survey panel
**Solution**: 
- Verify `surveysDataSet` is properly configured
- Check if Customer Voice surveys are active (statecode = 0)
- Ensure project ID filter matches your Customer Voice project
- Verify survey URLs are properly formatted

### Issue: Survey selection not working
**Solution**:
- Check browser console for JavaScript errors
- Verify `onSurveyChange` callback is properly configured
- Ensure surveys have valid `msfp_surveyid` and `msfp_name` fields

### Issue: Survey context not passed correctly
**Solution**:
- Verify person GUID format in URL encoding
- Check if `ag_userid` field is properly mapped
- Test survey URL manually with context parameter

### Organization and User Issues

### Issue: User team detection not working
**Solution**:
- Verify `ag_userid` field mapping in organization dataset
- Check GUID format consistency (with/without braces and hyphens)
- Ensure current user exists in organization dataset
- Test with different GUID formats in `ag_userid` field

### Issue: No data in hierarchy
**Solution**: 
- Check column mapping for all three datasets
- Verify organization view returns data with proper relationships
- Check console for pagination warnings (datasets > 1500 records)
- Ensure `managerId` references are correct

### Issue: Large dataset performance problems
**Solution**:
- Enable automatic pagination in dataset configuration
- Monitor browser memory usage with large hierarchies
- Consider filtering at data source level
- Check for circular references in manager relationships

### Visual and UI Issues

### Issue: Survey indicators not displaying
**Solution**: 
- Check `surveyResponsesDataSet` configuration and mapping
- Verify `survey_id` matches selected survey's `msfp_surveyid`
- Ensure `personId` in responses matches organization dataset `id`
- Check if user is in team scope for indicator visibility

### Issue: Fixed layout not displaying correctly
**Solution**:
- Verify container has sufficient space (minimum 1600x768px)
- Check CSS conflicts with parent containers
- Ensure ReactFlow styles are not overridden
- Test in different browser zoom levels

### Issue: Glow effects not working
**Solution**: 
- Verify `@codaworks/react-glow` library is installed and compatible
- Check for CSS conflicts affecting border-radius
- Ensure `GlowCapture` and `Glow` components are properly nested
- Test in different browsers for WebGL support

### Issue: Survey/Response buttons not appearing
**Solution**:
- Check team detection logic and user identification
- Verify button visibility logic in `shouldShowSurveyButton`
- Ensure survey is selected in the survey panel
- Check user permissions and team membership

### Performance Issues

### Issue: Control loading slowly with large datasets
**Solution**:
- Enable dataset paging at source (set page size to 1500)
- Implement data filtering at query level
- Monitor browser DevTools Performance tab
- Consider virtualization for very large hierarchies (500+ people)

### Issue: Memory usage increasing over time
**Solution**:
- Check for memory leaks in React components
- Ensure proper cleanup in useEffect hooks
- Monitor browser memory in DevTools
- Refresh control periodically for long-running sessions

### Data Synchronization Issues

### Issue: Response status not updating after survey completion
**Solution**:
- Trigger dataset refresh after survey submission
- Check response URL format and accessibility
- Verify response date is properly recorded
- Ensure survey response dataset includes latest responses

### Issue: Multiple surveys showing incorrect response counts
**Solution**:
- Verify survey ID filtering in response dataset
- Check for duplicate responses in dataset
- Ensure proper survey selection state management
- Test with single survey first, then multiple

### Browser and Compatibility Issues

### Issue: Control not working in specific browsers
**Solution**:
- Test in supported browsers (Edge, Chrome, Firefox)
- Check browser console for errors
- Verify WebGL support for glow effects
- Test with browser extensions disabled

### Issue: Touch interaction problems on mobile devices
**Solution**:
- Verify touch event handling in ReactFlow
- Test zoom and pan gestures
- Check button touch targets (minimum 44px)
- Test in mobile browser developer mode

## Debug Information

### Useful Console Commands
```javascript
// Check current user context
console.log('User ID:', context.userSettings.userId);

// Verify dataset loading
console.log('Organization records:', context.parameters.organizationDataSet.sortedRecordIds.length);
console.log('Survey records:', context.parameters.surveysDataSet.sortedRecordIds.length);
console.log('Response records:', context.parameters.surveyResponsesDataSet.sortedRecordIds.length);

// Test GUID normalization
const normalizeGuid = (guid) => guid.replace(/[{}-]/g, '').toLowerCase();
console.log('Normalized GUID:', normalizeGuid('{12345678-1234-1234-1234-123456789012}'));
```

## Roadmap

### Planned features:
- [ ] Export hierarchy to PDF/Excel with survey data
- [ ] Employee search with survey status filtering
- [ ] Different layouts (horizontal, circular, radial)
- [ ] Survey status transition animations
- [ ] Department grouping with response aggregates
- [ ] Team statistics and completion indicators
- [ ] Push notifications for new surveys
- [ ] Power BI integration for dashboards
- [ ] Bulk actions (mass survey sending)
- [ ] Custom templates for different survey types

## New Features v2.0

### ✅ **Implemented in current version:**
- **Dual datasets** - organization + responses
- **Visual status indicators** with glow effects
- **Smart action buttons** (survey vs responses)
- **Automatic team detection** for user
- **Real-time data linking** between datasets
- **Professional UI** with @codaworks/react-glow

### 🔄 **Being optimized:**
- **Performance** for large organizations (>500 people)
- **CSS overrides** for full Fluent UI compatibility
- **Error handling** for incorrect data

## Support

In case of control issues:
1. Check logs in browser Developer Tools
2. Verify dataset configuration
3. Ensure all dependencies are properly installed

---

## Latest Updates (v3.0)

### 🎯 **Multi-Survey Management System**
- **Dynamic Survey Selection**: Integrated dedicated survey panel with real-time switching between multiple surveys
- **Customer Voice Integration**: Direct integration with Microsoft Customer Voice (Forms Pro) surveys
- **Project-Based Filtering**: Automatic survey filtering based on Customer Voice project ID
- **Context-Aware URLs**: Survey URLs automatically enriched with person context data for personalized responses

### 📊 **Triple Dataset Architecture**
- **Surveys Dataset**: Dynamic loading of available surveys from Customer Voice projects
- **Enhanced Organization Dataset**: Extended with `ag_userid` field for precise user identification
- **Advanced Response Tracking**: Real-time response status updates with visual indicators

### 🎨 **Enhanced User Interface**
- **Split-Panel Layout**: Dedicated 20% sidebar for survey management with 80% main hierarchy view
- **Survey Selection Cards**: Interactive survey cards with selection states and metadata
- **Fixed Dimensions**: Optimized layout with consistent 1600x768px container for better performance
- **Professional Styling**: Enhanced visual hierarchy with proper spacing and responsive design

### ⚡ **Performance & Data Handling**
- **Automatic Pagination**: Smart loading of large datasets with automatic page handling (1500 records per page)
- **Background Data Loading**: Non-blocking data loading for better user experience  
- **Optimized Re-rendering**: Efficient React state management to minimize unnecessary re-renders
- **Memory Management**: Proper cleanup and disposal of resources

### 🔧 **Technical Improvements**
- **Enhanced TypeScript**: Extended interfaces for better type safety and IntelliSense support
- **ESLint Configuration**: Modern ESLint 9+ configuration with Power Apps specific rules
- **React 17 Compatibility**: Updated to latest supported React version for PCF controls
- **WebAPI Integration**: Enhanced WebAPI feature usage for better data connectivity

## Changelog

### v3.0.0 (2025-09-11) - **CURRENT VERSION**
- 🚀 **MAJOR**: Multi-survey management system with dynamic selection
- ✨ **FEATURE**: Customer Voice integration with automatic project filtering  
- 🎨 **FEATURE**: Split-panel UI design with dedicated survey sidebar
- 📊 **FEATURE**: Triple dataset architecture (surveys + organization + responses)
- ⚡ **IMPROVEMENT**: Automatic pagination handling for large datasets
- 🔧 **TECH**: Enhanced TypeScript interfaces and type safety
- 🎯 **TECH**: Context-aware survey URL generation with personalization
- 📱 **UI**: Fixed-dimension layout (1600x768) for consistent rendering
- 🔄 **OPTIMIZATION**: Background data loading and efficient state management
- 🧹 **CLEANUP**: Modernized ESLint configuration and code standards

### v2.0.0 (2024-09-09)
- ✅ **MAJOR**: Added second dataset for survey responses
- ✅ **FEATURE**: Visual survey status indicators with glow effects
- ✅ **FEATURE**: Smart buttons - "Open Survey" vs "View Responses"
- ✅ **FEATURE**: Automatic user team detection
- ✅ **IMPROVEMENT**: Replaced PersonCircle icons with survey indicators
- ✅ **TECH**: Integration with @codaworks/react-glow
- ✅ **TECH**: Extended TypeScript interfaces
- 🗑️ **CLEANUP**: Removed unnecessary HelloWorld.tsx file

### v1.0.0 (2024-08-XX)
- ✅ Basic organizational hierarchy
- ✅ ReactFlow + Dagre layout
- ✅ Fluent UI design system
- ✅ Single organizational dataset
- ✅ Basic survey buttons

*Built with Power Platform PCF Framework, ReactFlow, Fluent UI and @codaworks/react-glow*
