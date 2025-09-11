# OrganizationTreeV2 - PCF Control with Survey Integration

Advanced PCF control displaying interactive organizational hierarchy with integrated Customer Voice survey system, modal response viewing, and comprehensive survey descriptions.

## Key Features

### 🌳 **Interactive Hierarchy**
- **ReactFlow + Dagre**: Automatic tree layout with zoom/pan controls
- **Smart Filtering**: "All" vs "My Team Only" views with automatic manager detection
- **Employee Cards**: Display name, position, email with visual survey indicators

### 📊 **Enhanced Survey Integration**
- **Customer Voice Integration**: Direct Microsoft Customer Voice (Forms Pro) integration
- **Three-Column Layout**: Organization Tree (70%) | Survey List (15%) | Survey Description (15%)
- **Dynamic Survey Selection**: Real-time switching between multiple surveys with detailed descriptions
- **Project Filtering**: Filter surveys by Customer Voice project ID
- **Modal Response Viewing**: View survey responses in modal dialogs using `Xrm.Navigation.navigateTo`
- **Enhanced Survey Display**: Bold selection indicators with checkmark icons for active surveys

### 🎯 **Visual Status System**
- **🟢 Green Glow**: Employee responded to selected survey
- **🔴 Red Glow**: Employee hasn't responded to selected survey  
- **⚪ Standard Icon**: Employee outside user's team
- **Smart Buttons**: "Open Survey" vs "View Responses" based on status

### 🔧 **Modal Dialog Implementation**
- **Primary**: `Xrm.Navigation.navigateTo` for existing survey response records
- **Fallback**: PCF `navigation.openForm` for compatibility
- **Final Fallback**: Direct URL opening in new tab
- **Entity**: `msfp_surveyresponse` records opened in modal dialog

## Architecture

### Components
- **OrganizationTree**: Main hierarchy management with ReactFlow integration and three-column layout
- **PersonNode**: Individual employee cards with survey actions
- **Survey Panel**: Dynamic survey selection interface with enhanced UI (15% width)
- **Description Panel**: Dedicated survey description display area (15% width)

### Layout System
- **Fixed Dimensions**: 1900px total width, 768px height for optimal performance
- **Column Distribution**: Tree (70% - 1330px) | Survey List (15% - 285px) | Description (15% - 285px)
- **Responsive Design**: Optimized for standard business monitor resolutions

### Services
- **OrganizationService**: Hierarchy building and team detection
- **LayoutService**: Dagre-based automatic positioning

### Modal Response Viewing
```typescript
// Primary method - Xrm.Navigation.navigateTo
const pageInput = {
  pageType: "entityrecord",
  entityName: "msfp_surveyresponse",
  entityId: responseId  // Existing response record
};

const navigationOptions = {
  target: 2,  // Modal dialog
  height: { value: 80, unit: "%" },
  width: { value: 70, unit: "%" },
  position: 1  // Centered
};
```

## Dataset Configuration

### 1. Surveys Dataset (Customer Voice)
```
msfp_surveyid → Survey GUID
msfp_name → Survey display name  
msfp_surveyurl → Survey URL
msfp_projectid → Project ID filter
msfp_description → Survey description text (NEW)
```

### 2. Organization Dataset
```
id → Employee GUID
name → Full name
position → Job title
managerId → Manager GUID
email → Email address
ag_userid → System User ID (for team detection)
```

### 3. Survey Responses Dataset
```
responseId → Response GUID (for modal viewing)
survey_id → Survey GUID (foreign key)
personId → Employee GUID (foreign key) 
responseUrl → Response URL (fallback)
responseDate → Completion timestamp
```

## Installation

### 1. Build & Deploy
```bash
npm run build
pac pcf push --publisher-prefix yourprefix
```

### 2. Configuration
1. Add control to Power Apps form
2. Configure 3 datasets with proper column mapping
3. Set optional Project ID for survey filtering
4. Ensure `msfp_surveyresponse` entity access for modal viewing

### 3. Required Table Views

#### Organization View (Enhanced)
```sql
SELECT 
    e.employeeid as id,
    e.fullname as name,
    e.jobtitle as position,
    e.managerid as managerId,
    e.emailaddress as email,
    su.systemuserid as ag_userid  -- For team detection
FROM employees e
INNER JOIN systemusers su ON e.emailaddress = su.internalemailaddress
WHERE e.statuscode = 1
```

#### Survey Responses View (Modal Ready)
```sql
SELECT 
    sr.msfp_surveyresponseid as responseId,  -- For modal dialog
    sr.msfp_surveyid as survey_id,
    e.employeeid as personId,
    sr.msfp_responseurl as responseUrl,  -- Fallback URL
    sr.createdon as responseDate
FROM msfp_surveyresponse sr
LEFT JOIN systemusers su ON sr.msfp_respondent = su.systemuserid
LEFT JOIN employees e ON su.internalemailaddress = e.emailaddress
WHERE sr.statecode = 0
```

## Key Improvements in v5.0

### ✅ **Three-Column Enhanced Layout**
- **Survey Description Panel**: Dedicated 15% column for displaying detailed survey descriptions
- **Optimized Proportions**: Tree (70%) | Survey List (15%) | Description (15%) for maximum usability
- **Fixed Dimensions**: 1900px total width with pixel-perfect layout calculations
- **Enhanced Survey UI**: Bold text and checkmark icons for selected surveys

### ✅ **Survey Description Integration**
- **New Data Field**: Added `msfp_description` field support in ControlManifest
- **Dynamic Display**: Real-time description updates when switching between surveys
- **TypeScript Integration**: Enhanced type definitions for Survey and SelectedSurvey interfaces
- **Responsive Content**: Proper text wrapping and scrolling for long descriptions

### ✅ **Modal Dialog System**
- **Enhanced Navigation**: Uses `Xrm.Navigation.navigateTo` for proper modal dialogs
- **Existing Record Viewing**: Opens actual survey response records, not creation forms
- **Graceful Fallbacks**: Multiple fallback methods ensure reliability
- **Professional UX**: Modal dialogs instead of new tabs/windows

### ✅ **Robust Error Handling**
- **Multi-level Fallbacks**: Xrm.Navigation → PCF Navigation → Direct URL
- **Detailed Logging**: Comprehensive console logging for debugging
- **User-Friendly**: Smooth experience even when primary methods fail

### ✅ **Enhanced Performance**
- **Optimized Rendering**: Efficient React state management
- **Background Loading**: Non-blocking data operations
- **Memory Management**: Proper cleanup and resource disposal

## Dependencies

```json
{
  "@fluentui/react-components": "9.46.2",
  "@fluentui/react-icons": "^2.0.239", 
  "@codaworks/react-glow": "^1.0.6",
  "dagre": "^0.8.5",
  "reactflow": "^11.11.4"
}
```

## Troubleshooting

### Modal Dialog Issues
- **No Modal Opening**: Check `msfp_surveyresponse` entity permissions
- **Wrong Record**: Verify `responseId` format and existence
- **Fallback Activation**: Check browser console for Xrm availability

### Team Detection Issues  
- **No Team Members**: Verify `ag_userid` field mapping and GUID formats
- **Wrong User Context**: Check current user exists in organization dataset

### Survey Integration Issues
- **No Surveys**: Verify Customer Voice integration and project filtering
- **Response Tracking**: Check survey ID matching between datasets
- **Missing Descriptions**: Ensure `msfp_description` field is properly mapped in dataset configuration

### Layout Issues
- **Column Sizing**: Fixed 1900px total width optimized for business monitors
- **Description Panel**: Verify survey description data is available and properly formatted
- **UI Elements**: Check Fluent UI icon dependencies for checkmark display

---

**Latest Version: v5.0** - Three-Column Layout with Survey Descriptions  
*Built with Power Platform PCF, ReactFlow, Fluent UI, and enhanced three-column architecture*
