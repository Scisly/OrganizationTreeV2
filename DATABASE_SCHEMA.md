# Database Schema - OrganizationTreeV2 PCF Control

This document describes the database schema and data requirements for the OrganizationTreeV2 Power Platform Control Framework (PCF) component.

## Overview

The OrganizationTreeV2 control integrates with Microsoft Dataverse and requires three main datasets:
1. **Organization Dataset** - Hierarchical employee/organizational data
2. **Surveys Dataset** - Microsoft Customer Voice survey information
3. **Survey Responses Dataset** - Individual survey response records

## Required Datasets

### 1. Organization Dataset (`organizationDataSet`)

This dataset contains the hierarchical organizational structure with employee information.

#### Required Fields

| Field Name | Display Name | Type | Required | Description |
|------------|--------------|------|----------|-------------|
| `id` | Record ID | SingleLine.Text | ✅ | Unique identifier for the person/employee |
| `name` | Person Name | SingleLine.Text | ✅ | Full name of the employee |
| `position` | Position Title | SingleLine.Text | ❌ | Job title/position |
| `managerId` | Manager ID | SingleLine.Text | ❌ | ID of the direct manager (references another record's `id`) |
| `email` | Email | SingleLine.Text | ❌ | Email address |
| `ag_userid` | User ID | SingleLine.Text | ❌ | System user ID (typically GUID format) |

#### Data Structure Example
```json
{
  "id": "emp001",
  "name": "John Smith",
  "position": "Senior Developer",
  "managerId": "emp002",
  "email": "john.smith@company.com",
  "ag_userid": "{12345678-1234-1234-1234-123456789012}"
}
```

#### Relationships
- **Hierarchical**: `managerId` field creates parent-child relationships
- **Self-referencing**: `managerId` points to another record's `id` in the same dataset

---

### 2. Surveys Dataset (`surveysDataSet`)

This dataset contains Microsoft Customer Voice survey definitions.

#### Required Fields

| Field Name | Display Name | Type | Required | Description |
|------------|--------------|------|----------|-------------|
| `msfp_surveyid` | Survey ID | SingleLine.Text | ✅ | Unique survey identifier |
| `msfp_name` | Survey Name | SingleLine.Text | ✅ | Display name of the survey |
| `msfp_surveyurl` | Survey URL | SingleLine.Text | ❌ | Direct URL to the survey |
| `msfp_projectid` | Project ID | SingleLine.Text | ❌ | Customer Voice project identifier |
| `msfp_description` | Survey Description | Multiple | ❌ | Detailed description of the survey purpose |

#### Data Structure Example
```json
{
  "msfp_surveyid": "survey123",
  "msfp_name": "Employee Satisfaction Q3 2025",
  "msfp_surveyurl": "https://customervoice.microsoft.com/...",
  "msfp_projectid": "project456",
  "msfp_description": "Quarterly employee satisfaction survey covering work environment, management, and career development."
}
```

---

### 3. Survey Responses Dataset (`surveyResponsesDataSet`)

This dataset tracks individual survey responses from employees.

#### Required Fields

| Field Name | Display Name | Type | Required | Description |
|------------|--------------|------|----------|-------------|
| `responseId` | Response ID | SingleLine.Text | ✅ | Unique response identifier |
| `survey_id` | Survey ID Response | SingleLine.Text | ✅ | References `msfp_surveyid` from surveys dataset |
| `personId` | Person ID Response | SingleLine.Text | ✅ | References `id` from organization dataset |
| `responseUrl` | Response URL | SingleLine.Text | ❌ | URL to view detailed response |
| `responseDate` | Response Date | DateAndTime.DateAndTime | ❌ | When the survey was completed |

#### Data Structure Example
```json
{
  "responseId": "resp789",
  "survey_id": "survey123",
  "personId": "emp001",
  "responseUrl": "https://customervoice.microsoft.com/responses/...",
  "responseDate": "2025-09-11T10:30:00Z"
}
```

#### Relationships
- **Survey Link**: `survey_id` → `surveysDataSet.msfp_surveyid`
- **Person Link**: `personId` → `organizationDataSet.id`

---

## Configuration Properties

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `projectId` | SingleLine.Text | ❌ | Customer Voice project ID for filtering surveys |

---

## Data Relationships Diagram

```mermaid
erDiagram
    ORGANIZATION_DATASET {
        string id PK "Unique identifier"
        string name "Person name"
        string position "Job title"
        string managerId FK "Manager ID (self-reference)"
        string email "Email address"
        string ag_userid "System user ID"
    }
    
    SURVEYS_DATASET {
        string msfp_surveyid PK "Survey unique identifier"
        string msfp_name "Survey name"
        string msfp_surveyurl "Survey URL"
        string msfp_projectid "Project ID"
        text msfp_description "Survey description"
    }
    
    SURVEY_RESPONSES_DATASET {
        string responseId PK "Response unique identifier"
        string survey_id FK "Survey ID reference"
        string personId FK "Person ID reference"
        string responseUrl "Response URL"
        datetime responseDate "Response completion date"
    }

    ORGANIZATION_DATASET ||--o{ ORGANIZATION_DATASET : "manages (self-reference)"
    ORGANIZATION_DATASET ||--o{ SURVEY_RESPONSES_DATASET : "completes"
    SURVEYS_DATASET ||--o{ SURVEY_RESPONSES_DATASET : "receives"
```

---

## Implementation Notes

### 1. Hierarchy Building
- The control builds hierarchical trees using `managerId` relationships
- Root nodes are records with `null` or empty `managerId`
- Circular references should be avoided in the data

### 2. User Context
- `ag_userid` field is used to identify the current user
- Supports both full GUID format and cleaned GUID format
- Used for "team view" filtering functionality

### 3. Survey Integration
- Surveys are filtered by `msfp_projectid` if `projectId` property is provided
- Survey URLs are enhanced with person context when launching
- Response tracking shows completion status per person

### 4. Performance Considerations
- Control loads up to 1500 records per dataset by default
- Implements pagination for large datasets
- Considers indexing `managerId`, `ag_userid`, `survey_id`, and `personId` fields

### 5. Data Quality Requirements
- Ensure `managerId` values exist as valid `id` values in the same dataset
- Maintain referential integrity between datasets
- Handle missing/null values gracefully in optional fields

---

## Microsoft Dataverse Setup

### Recommended Entity Configuration

1. **Custom Entity**: `ag_organizationmember`
   - Maps to Organization Dataset
   - Consider using Dataverse relationship features for hierarchy

2. **Customer Voice Integration**:
   - Use native `msfp_survey` and `msfp_surveyresponse` entities when possible
   - Ensure proper field mapping in PCF configuration

3. **Views and Filters**:
   - Create optimized views for the three datasets
   - Include necessary filters for performance
   - Consider using FetchXML for complex hierarchy queries

---

## Security Considerations

- Ensure users have appropriate read permissions on all three datasets
- Consider row-level security for sensitive organizational data
- Survey response data may contain confidential information
- Implement proper field-level security where needed

---

*Last Updated: September 11, 2025*
*Version: 1.0*
