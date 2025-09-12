import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
} from "../../types/OrganizationTypes";
import {
  normalizeGuid,
  compareGuids,
  safeGetRecordValue,
} from "./OrganizationService.internal";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;

export class OrganizationService {
  /**
   * Przekształca dane z DataSet do struktury hierarchicznej
   * @returns {hierarchy: hierarchia, allPeople: pełna lista osób}
   */
  public static buildHierarchyWithPeople(
    dataSet: ComponentFramework.PropertyTypes.DataSet,
    filterOptions?: HierarchyFilterOptions,
  ): { hierarchy: OrganizationPerson[]; allPeople: OrganizationPerson[] } {
    const people: OrganizationPerson[] = [];

    // Sprawdź czy istnieją dodatkowe strony danych
    if (dataSet.paging?.hasNextPage) {
      console.warn(
        "UWAGA: Dataset ma więcej stron danych. Tylko pierwsza strona jest załadowana.",
      );
    }

    // Konwersja danych z DataSet
    if (dataSet.sortedRecordIds && dataSet.sortedRecordIds.length > 0) {
      dataSet.sortedRecordIds.forEach((recordId) => {
        const record = dataSet.records[recordId];

        // Debug: sprawdź wartości pól
        const person: OrganizationPerson = {
          id: safeGetRecordValue(record, "id", "") as string,
          name: safeGetRecordValue(record, "name", "") as string,
          position: safeGetRecordValue<string>(record, "position") ?? undefined,
          managerId:
            safeGetRecordValue<string>(record, "managerId") ?? undefined,
          email: safeGetRecordValue<string>(record, "email") ?? undefined,
          ag_userid:
            safeGetRecordValue<string>(record, "ag_userid") ?? undefined,
          children: [],
        };

        people.push(person);
      });
    }

    // Budowanie hierarchii
    const hierarchy = this.buildTreeStructure(people);

    // Stosowanie filtrów - jeśli currentUserId jest podany, automatycznie filtruj do zespołu
    if (filterOptions?.currentUserId) {
      // Jeśli showOnlyTeam jest false, pokaż całą hierarchię
      // Jeśli showOnlyTeam jest true lub nie ustawiony, filtruj do zespołu
      if (filterOptions.showOnlyTeam !== false) {
        const filteredHierarchy = this.filterByUserId(
          people,
          hierarchy,
          filterOptions.currentUserId,
        );
        return { hierarchy: filteredHierarchy, allPeople: people };
      }
    }

    return { hierarchy, allPeople: people };
  }

  /**
   * Przekształca dane z DataSet do struktury hierarchicznej (dla kompatybilności)
   */
  public static buildHierarchy(
    dataSet: ComponentFramework.PropertyTypes.DataSet,
    filterOptions?: HierarchyFilterOptions,
  ): OrganizationPerson[] {
    return this.buildHierarchyWithPeople(dataSet, filterOptions).hierarchy;
  }

  /**
   * Buduje strukturę drzewiastą z płaskiej listy osób
   */
  private static buildTreeStructure(
    people: OrganizationPerson[],
  ): OrganizationPerson[] {
    const personMap = new Map<string, OrganizationPerson>();
    const rootPeople: OrganizationPerson[] = [];

    // Tworzenie mapy osób
    people.forEach((person) => {
      personMap.set(person.id, { ...person, children: [] });
    });

    // Budowanie hierarchii
    people.forEach((person) => {
      const personNode = personMap.get(person.id)!;

      if (person.managerId && personMap.has(person.managerId)) {
        const manager = personMap.get(person.managerId)!;
        manager.children!.push(personNode);
      } else {
        // Brak managera = CEO lub root node
        rootPeople.push(personNode);
      }
    });

    // Ustawianie poziomów
    this.setLevels(rootPeople, 0);

    return rootPeople;
  }

  /**
   * Ustawia poziomy w hierarchii (dla layoutu)
   */
  private static setLevels(people: OrganizationPerson[], level: number): void {
    people.forEach((person) => {
      person.level = level;
      if (person.children && person.children.length > 0) {
        this.setLevels(person.children, level + 1);
      }
    });
  }

  /**
   * Filtruje hierarchię na podstawie userId - znajduje użytkownika i pokazuje jego zespół
   */
  private static filterByUserId(
    allPeople: OrganizationPerson[],
    hierarchy: OrganizationPerson[],
    userId: string,
  ): OrganizationPerson[] {
    // Najpierw spróbuj znaleźć użytkownika po ag_userid
    let currentUser = allPeople.find((person) => person.ag_userid === userId);

    // Jeśli nie znaleziono po ag_userid, spróbuj porównać bez formatowania GUID
    currentUser ??= allPeople.find((person) => {
      if (!person.ag_userid || !userId) return false;
      // Usuń klamry i myślniki z userId jeśli to GUID
      const cleanUserId = normalizeGuid(userId);
      const cleanAgUserId = normalizeGuid(person.ag_userid);
      return cleanAgUserId === cleanUserId;
    });

    // Jeśli dalej nie znaleziono, sprawdź czy userId odpowiada id w datasecie
    currentUser ??= allPeople.find((person) => person.id === userId);

    if (!currentUser) {
      console.warn(
        `OrganizationService: Nie znaleziono użytkownika o ID: ${userId}`,
      );
      return []; // Nie znaleziono użytkownika
    }

    // Zbuduj pełną hierarchię podwładnych rekursywnie
    const userWithTeam: OrganizationPerson = {
      ...currentUser,
      children: this.buildSubordinatesHierarchy(allPeople, currentUser.id),
    };

    // Zwróć użytkownika z jego pełną hierarchią jako root
    return [userWithTeam];
  }

  /**
   * Znajdź osobę po ag_userid w płaskiej liście (z obsługą różnych formatów GUID)
   */
  private static findPersonByUserId(
    people: OrganizationPerson[],
    userId: string,
  ): OrganizationPerson | null {
    // Najpierw spróbuj dokładnego dopasowania
    let found = people.find((person) => person.ag_userid === userId);
    if (found) {
      return found;
    }

    // Jeśli nie znaleziono, spróbuj porównać bez formatowania GUID
    const cleanUserId = userId.replace(/[{}-]/g, "").toLowerCase();

    found = people.find((person) => {
      if (!person.ag_userid) return false;
      const cleanAgUserId = person.ag_userid
        .replace(/[{}-]/g, "")
        .toLowerCase();
      return cleanAgUserId === cleanUserId;
    });

    return found ?? null;
  }

  /**
   * Znajdź osobę po ID w hierarchii
   */
  private static findPersonById(
    people: OrganizationPerson[],
    id: string,
  ): OrganizationPerson | null {
    for (const person of people) {
      if (person.id === id) {
        return person;
      }

      if (person.children && person.children.length > 0) {
        const found = this.findPersonById(person.children, id);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Sprawdza czy dana osoba należy do zespołu aktualnego użytkownika
   * Uproszczona logika: wszystkie widoczne osoby po filtrze powinny mieć przycisk
   */
  public static isPersonInCurrentUserTeam(
    hierarchy: OrganizationPerson[],
    personId: string,
    currentUserId?: string,
    allPeople?: OrganizationPerson[],
  ): boolean {
    if (!currentUserId || !allPeople) {
      return false;
    }

    // Znajdź aktualnego użytkownika po ag_userid
    const currentUser = this.findPersonByUserId(allPeople, currentUserId);
    if (!currentUser) {
      return false;
    }

    // Znajdź sprawdzaną osobę po personId (to jest ID z datasetu)
    const person = allPeople.find((p) => p.id === personId);
    if (!person) {
      return false;
    }

    // Sprawdź czy to aktualny użytkownik (porównaj przez ag_userid z normalizacją)
    let isCurrentUser = false;
    if (person.ag_userid && currentUserId) {
      // Bezpośrednie porównanie
      if (person.ag_userid === currentUserId) {
        isCurrentUser = true;
      } else {
        // Porównanie z normalizacją GUID (usuń klamry i myślniki)
        const normalizedPersonId = normalizeGuid(person.ag_userid);
        const normalizedCurrentId = normalizeGuid(currentUserId);
        isCurrentUser = normalizedPersonId === normalizedCurrentId;
      }
    }

    // Sprawdź czy to podwładny aktualnego użytkownika (bezpośrednio lub pośrednio)
    const isTeamMember = this.isPersonSubordinateOf(
      allPeople,
      person.id,
      currentUser.id,
    );

    return isCurrentUser || isTeamMember;
  }

  /**
   * Płaska lista wszystkich osób z hierarchii
   */
  public static flattenHierarchy(
    hierarchy: OrganizationPerson[],
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
   * Rekursywnie buduje hierarchię podwładnych dla danego managera
   */
  private static buildSubordinatesHierarchy(
    allPeople: OrganizationPerson[],
    managerId: string,
    level = 0,
  ): OrganizationPerson[] {
    // Znajdź bezpośrednich podwładnych tego managera
    const directSubordinates = allPeople.filter(
      (person) => person.managerId === managerId,
    );

    // Dla każdego podwładnego, rekursywnie zbuduj jego hierarchię
    return directSubordinates.map((subordinate) => ({
      ...subordinate,
      children: this.buildSubordinatesHierarchy(
        allPeople,
        subordinate.id,
        level + 1,
      ),
    }));
  }

  /**
   * Sprawdza czy osoba jest podwładnym managera (bezpośrednio lub pośrednio)
   */
  private static isPersonSubordinateOf(
    allPeople: OrganizationPerson[],
    personId: string,
    managerId: string,
  ): boolean {
    const person = allPeople.find((p) => p.id === personId);
    if (!person?.managerId) {
      return false;
    }

    // Bezpośredni podwładny
    if (person.managerId === managerId) {
      return true;
    }

    // Pośredni podwładny - sprawdź rekursywnie w górę hierarchii
    return this.isPersonSubordinateOf(allPeople, person.managerId, managerId);
  }

  /**
   * Przetwarza odpowiedzi z ankiet z datasetu
   */
  public static processSurveyResponses(
    dataSet: ComponentFramework.PropertyTypes.DataSet,
    surveyId: string,
  ): SurveyResponse[] {
    const responses: SurveyResponse[] = [];

    if (!dataSet.sortedRecordIds || dataSet.sortedRecordIds.length === 0) {
      return responses;
    }

    dataSet.sortedRecordIds.forEach((recordId) => {
      const record = dataSet.records[recordId];

      const responseRecord: SurveyResponse = {
        responseId: safeGetRecordValue(record, "responseId", "") as string,
        surveyId: safeGetRecordValue(record, "survey_id", "") as string,
        personId: safeGetRecordValue(record, "personId", "") as string,
        responseUrl:
          safeGetRecordValue<string>(record, "responseUrl") ?? undefined,
        responseDate:
          safeGetRecordValue<Date>(record, "responseDate") ?? undefined,
      };

      // Filtruj tylko odpowiedzi dla obecnej ankiety
      if (responseRecord.surveyId === surveyId) {
        responses.push(responseRecord);
      }
    });

    return responses;
  }

  /**
   * Znajdź odpowiedź dla danej osoby
   */
  public static findResponseForPerson(
    responses: SurveyResponse[],
    personId: string,
  ): SurveyResponse | undefined {
    return responses.find((response) => response.personId === personId);
  }
}
