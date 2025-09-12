/**
 * Internal utility functions for OrganizationService
 * These are UI-agnostic helper functions that support the main service
 */

/**
 * Normalizes GUID by removing braces and hyphens, converting to lowercase
 */
export const normalizeGuid = (guid: string): string => {
  return guid.replace(/[{}-]/g, "").toLowerCase();
};

/**
 * Compares two GUIDs with normalization
 */
export const compareGuids = (guid1: string, guid2: string): boolean => {
  if (guid1 === guid2) {
    return true;
  }
  return normalizeGuid(guid1) === normalizeGuid(guid2);
};

/**
 * Validates if a string is a valid GUID format
 */
export const isValidGuid = (value: string): boolean => {
  const guidRegex =
    /^[{(]?[0-9a-f]{8}[-]?[0-9a-f]{4}[-]?[0-9a-f]{4}[-]?[0-9a-f]{4}[-]?[0-9a-f]{12}[)}]?$/i;
  return guidRegex.test(value);
};

/**
 * Safely gets a value from a record, handling potential null/undefined
 */
export const safeGetRecordValue = <T = unknown>(
  record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  fieldName: string,
  defaultValue?: T,
): T | undefined => {
  try {
    const value = record.getValue(fieldName);
    return value !== null && value !== undefined ? (value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Creates a deep copy of an organization person (for avoiding mutations)
 */
export const cloneOrganizationPerson = (
  person: import("../../types/OrganizationTypes").OrganizationPerson,
): import("../../types/OrganizationTypes").OrganizationPerson => {
  return {
    ...person,
    children: person.children
      ? person.children.map((child) => cloneOrganizationPerson(child))
      : undefined,
  };
};

/**
 * Validates hierarchy for cycles (prevents infinite loops)
 */
export const validateHierarchyForCycles = (
  people: import("../../types/OrganizationTypes").OrganizationPerson[],
): boolean => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (
    personId: string,
    peopleMap: Map<
      string,
      import("../../types/OrganizationTypes").OrganizationPerson
    >,
  ): boolean => {
    if (recursionStack.has(personId)) {
      return true; // Cycle detected
    }
    if (visited.has(personId)) {
      return false; // Already processed
    }

    visited.add(personId);
    recursionStack.add(personId);

    const person = peopleMap.get(personId);
    if (person?.managerId) {
      if (hasCycle(person.managerId, peopleMap)) {
        return true;
      }
    }

    recursionStack.delete(personId);
    return false;
  };

  // Create a map for efficient lookup
  const peopleMap = new Map<
    string,
    import("../../types/OrganizationTypes").OrganizationPerson
  >();
  const flattenPeople = (
    persons: import("../../types/OrganizationTypes").OrganizationPerson[],
  ) => {
    persons.forEach((person) => {
      peopleMap.set(person.id, person);
      if (person.children) {
        flattenPeople(person.children);
      }
    });
  };
  flattenPeople(people);

  // Check each person for cycles
  for (const person of peopleMap.values()) {
    if (!visited.has(person.id)) {
      if (hasCycle(person.id, peopleMap)) {
        console.warn(
          `Cycle detected in hierarchy starting from person: ${person.name} (${person.id})`,
        );
        return false;
      }
    }
  }

  return true;
};
