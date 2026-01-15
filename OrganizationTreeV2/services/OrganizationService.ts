import {
  OrganizationPerson,
  HierarchyFilterOptions,
  SurveyResponse,
} from "../types/OrganizationTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;

export class OrganizationService {
  /**
   * Przekształca dane z DataSet do struktury hierarchicznej
   * @returns {hierarchy: hierarchia, allPeople: pełna lista osób}
   */
  public static buildHierarchyWithPeople(
    dataSet: ComponentFramework.PropertyTypes.DataSet,
    filterOptions?: HierarchyFilterOptions
  ): { hierarchy: OrganizationPerson[]; allPeople: OrganizationPerson[] } {
    const people: OrganizationPerson[] = [];

    // Early return if dataset is not ready - no side effects, just return empty
    if (!dataSet || dataSet.loading) {
      return { hierarchy: [], allPeople: [] };
    }

    if (!dataSet.sortedRecordIds || dataSet.sortedRecordIds.length === 0) {
      return { hierarchy: [], allPeople: [] };
    }

    // Konwersja danych z DataSet
    if (dataSet.sortedRecordIds && dataSet.sortedRecordIds.length > 0) {
      dataSet.sortedRecordIds.forEach((recordId) => {
        const record = dataSet.records[recordId];

        // Debug: sprawdź wartości pól
        const person: OrganizationPerson = {
          id: record.getValue("id") as string,
          name: record.getValue("name") as string,
          position: (record.getValue("position") as string) || undefined,
          managerId: (record.getValue("managerId") as string) || undefined,
          email: (record.getValue("email") as string) || undefined,
          ag_userid: (record.getValue("ag_userid") as string) || undefined,
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
          filterOptions.currentUserId
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
    filterOptions?: HierarchyFilterOptions
  ): OrganizationPerson[] {
    return this.buildHierarchyWithPeople(dataSet, filterOptions).hierarchy;
  }

  /**
   * Sprawdza czy email należy do pracownika "blue collar"
   * Wzorzec: cyfry + @assaabloy.com (np. 123456@assaabloy.com)
   */
  public static isBlueCollarEmail(email?: string): boolean {
    if (!email) return false;
    const blueCollarPattern = /^\d+@assaabloy\.com$/i;
    return blueCollarPattern.test(email.trim());
  }

  /**
   * Buduje strukturę drzewiastą z płaskiej listy osób
   */
  private static buildTreeStructure(
    people: OrganizationPerson[]
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
    userId: string
  ): OrganizationPerson[] {
    // Najpierw spróbuj znaleźć użytkownika po ag_userid
    let currentUser = allPeople.find((person) => person.ag_userid === userId);

    // Jeśli nie znaleziono po ag_userid, spróbuj porównać bez formatowania GUID
    if (!currentUser) {
      // Usuń klamry i myślniki z userId jeśli to GUID
      const cleanUserId = userId.replace(/[{}-]/g, "").toLowerCase();
      currentUser = allPeople.find((person) => {
        if (!person.ag_userid) return false;
        const cleanAgUserId = person.ag_userid
          .replace(/[{}-]/g, "")
          .toLowerCase();
        return cleanAgUserId === cleanUserId;
      });
    }

    // Jeśli dalej nie znaleziono, sprawdź czy userId odpowiada id w datasecie
    currentUser ??= allPeople.find((person) => person.id === userId);

    if (!currentUser) {
      console.warn(
        `OrganizationService: Nie znaleziono użytkownika o ID: ${userId}`
      );
      return []; // Nie znaleziono użytkownika
    }

    // Zbuduj hierarchię podwładnych (tylko bezpośredni podwładni - maxDepth=1)
    const userWithTeam: OrganizationPerson = {
      ...currentUser,
      children: this.buildSubordinatesHierarchy(
        allPeople,
        currentUser.id,
        0,      // poziom startuje od 0
        1       // maxDepth=1 - pokazuj tylko bezpośrednich podwładnych
      ),
    };

    // Zwróć użytkownika z hierarchią bezpośrednich podwładnych jako root
    return [userWithTeam];
  }

  /**
   * Filtruje hierarchię - pokazuje użytkownika i jego zespół (podwładnych)
   */
  private static filterByTeam(
    hierarchy: OrganizationPerson[],
    currentUserId: string
  ): OrganizationPerson[] {
    // Znajdź aktualnego użytkownika w hierarchii
    const currentUser = this.findPersonById(hierarchy, currentUserId);

    if (currentUser) {
      // Utwórz kopię użytkownika z jego zespołem
      const userWithTeam: OrganizationPerson = {
        ...currentUser,
        children: currentUser.children ? [...currentUser.children] : [],
      };

      // Zwróć użytkownika z jego zespołem jako root
      return [userWithTeam];
    }

    // Jeśli nie znaleziono użytkownika, zwróć pustą hierarchię
    return [];
  }

  /**
   * Filtruje hierarchię - pokazuje tylko zespół danego managera (DEPRECATED - użyj filterByTeam)
   */
  private static filterByManager(
    hierarchy: OrganizationPerson[],
    managerId: string
  ): OrganizationPerson[] {
    // Znajdź managera w hierarchii
    const manager = this.findPersonById(hierarchy, managerId);

    if (manager) {
      // Zwróć tylko jego dział (bez osób wyżej w hierarchii)
      return [manager];
    }

    return hierarchy;
  }

  /**
   * Znajdź osobę po ag_userid w płaskiej liście (z obsługą różnych formatów GUID)
   */
  private static findPersonByUserId(
    people: OrganizationPerson[],
    userId: string
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
    id: string
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
    allPeople?: OrganizationPerson[]
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
        const normalizedPersonId = person.ag_userid
          .replace(/[{}-]/g, "")
          .toLowerCase();
        const normalizedCurrentId = currentUserId
          .replace(/[{}-]/g, "")
          .toLowerCase();
        isCurrentUser = normalizedPersonId === normalizedCurrentId;
      }
    }

    // Sprawdź czy to podwładny aktualnego użytkownika (bezpośrednio lub pośrednio)
    const isTeamMember = this.isPersonSubordinateOf(
      allPeople,
      person.id,
      currentUser.id
    );

    return isCurrentUser || isTeamMember;
  }

  /**
   * Sprawdza czy manager jest managerem danej osoby (bezpośrednio lub pośrednio)
   */
  private static isPersonManagerOf(
    allPeople: OrganizationPerson[],
    managerId: string,
    personId: string
  ): boolean {
    const person = allPeople.find((p) => p.id === personId);
    if (!person) return false;

    let currentManagerId = person.managerId;
    const visited = new Set<string>(); // Zabezpieczenie przed cyklami

    while (currentManagerId && !visited.has(currentManagerId)) {
      visited.add(currentManagerId);

      if (currentManagerId === managerId) {
        return true; // Znaleziono managera w hierarchii
      }

      // Idź poziom wyżej
      const manager = allPeople.find((p) => p.id === currentManagerId);
      currentManagerId = manager?.managerId;
    }

    return false;
  }

  /**
   * Rekurencyjnie sprawdza czy dana osoba jest w zespole (podwładnych) managera
   */
  private static isPersonInTeam(
    manager: OrganizationPerson,
    personId: string
  ): boolean {
    if (!manager.children || manager.children.length === 0) {
      return false;
    }

    for (const child of manager.children) {
      if (child.id === personId) {
        return true; // Znaleziono osobę jako bezpośredniego podwładnego
      }

      // Rekurencyjnie sprawdź w zespole podwładnego
      if (this.isPersonInTeam(child, personId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Płaska lista wszystkich osób z hierarchii
   */
  public static flattenHierarchy(
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
   * Rekursywnie buduje hierarchię podwładnych dla danego managera
   */
  private static buildSubordinatesHierarchy(
    allPeople: OrganizationPerson[],
    managerId: string,
    level = 0,
    maxDepth = Infinity  // Domyślnie nieograniczona głębokość (kompatybilność wsteczna)
  ): OrganizationPerson[] {
    // Zatrzymaj rekurencję jeśli osiągnięto maksymalną głębokość
    if (level >= maxDepth) {
      return [];
    }

    // Znajdź bezpośrednich podwładnych tego managera
    const directSubordinates = allPeople.filter(
      (person) => person.managerId === managerId
    );

    // Dla każdego podwładnego, rekursywnie zbuduj jego hierarchię
    return directSubordinates.map((subordinate) => ({
      ...subordinate,
      children: this.buildSubordinatesHierarchy(
        allPeople,
        subordinate.id,
        level + 1,
        maxDepth  // Przekaż maxDepth do rekurencyjnych wywołań
      ),
    }));
  }

  /**
   * Liczy wszystkich ludzi w hierarchii (włącznie z rootem)
   */
  private static countAllSubordinates(person: OrganizationPerson): number {
    let count = 1; // Liczmy siebie

    if (person.children && person.children.length > 0) {
      count += person.children.reduce((total, child) => {
        return total + this.countAllSubordinates(child);
      }, 0);
    }

    return count;
  }

  /**
   * Sprawdza czy osoba jest podwładnym managera (bezpośrednio lub pośrednio)
   */
  private static isPersonSubordinateOf(
    allPeople: OrganizationPerson[],
    personId: string,
    managerId: string
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
    surveyId: string
  ): SurveyResponse[] {
    const responses: SurveyResponse[] = [];

    if (!dataSet.sortedRecordIds || dataSet.sortedRecordIds.length === 0) {
      return responses;
    }

    dataSet.sortedRecordIds.forEach((recordId) => {
      const record = dataSet.records[recordId];

      const responseRecord: SurveyResponse = {
        responseId: record.getValue("responseId") as string,
        surveyId: record.getValue("survey_id") as string,
        personId: record.getValue("personId") as string,
        responseUrl: (record.getValue("responseUrl") as string) || undefined,
        responseDate: (record.getValue("responseDate") as Date) || undefined,
      };

      // Filtruj tylko odpowiedzi dla obecnej ankiety
      if (responseRecord.surveyId === surveyId) {
        responses.push(responseRecord);
      }
    });

    return responses;
  }

  /**
   * Przetwarza WSZYSTKIE odpowiedzi z ankiet z datasetu (bez filtrowania po surveyId)
   * Używane do logiki łańcuchowej etapów
   */
  public static processSurveyResponsesAll(
    dataSet: ComponentFramework.PropertyTypes.DataSet
  ): SurveyResponse[] {
    const responses: SurveyResponse[] = [];

    if (!dataSet.sortedRecordIds || dataSet.sortedRecordIds.length === 0) {
      return responses;
    }

    dataSet.sortedRecordIds.forEach((recordId) => {
      const record = dataSet.records[recordId];

      const responseRecord: SurveyResponse = {
        responseId: record.getValue("responseId") as string,
        surveyId: record.getValue("survey_id") as string,
        personId: record.getValue("personId") as string,
        responseUrl: (record.getValue("responseUrl") as string) || undefined,
        responseDate: (record.getValue("responseDate") as Date) || undefined,
      };

      responses.push(responseRecord);
    });

    return responses;
  }

  /**
   * Znajdź odpowiedź dla danej osoby
   */
  public static findResponseForPerson(
    responses: SurveyResponse[],
    personId: string
  ): SurveyResponse | undefined {
    return responses.find((response) => response.personId === personId);
  }

  /**
   * Sprawdza czy osoba ma podwładnych (jest przełożonym)
   */
  public static hasSubordinates(
    personId: string,
    allPeople: OrganizationPerson[]
  ): boolean {
    // Sprawdź czy istnieją osoby które mają tę osobę jako managera
    return allPeople.some((person) => person.managerId === personId);
  }

  /**
   * Znajduje użytkownika po ag_userid z obsługą różnych formatów GUID
   * Obsługuje zarówno format z klamrami {GUID} jak i bez
   */
  public static findUserByUserId(
    userId: string,
    allPeople: OrganizationPerson[]
  ): OrganizationPerson | undefined {
    if (!userId || allPeople.length === 0) {
      return undefined;
    }

    // Najpierw spróbuj dokładnego dopasowania po ag_userid
    let currentUser = allPeople.find((person) => person.ag_userid === userId);

    // Jeśli nie znaleziono, spróbuj z normalizacją GUID (bez klamr i myślników)
    if (!currentUser) {
      const cleanUserId = userId.replace(/[{}-]/g, "").toLowerCase();
      currentUser = allPeople.find((person) => {
        if (!person.ag_userid) return false;
        const cleanAgUserId = person.ag_userid
          .replace(/[{}-]/g, "")
          .toLowerCase();
        return cleanAgUserId === cleanUserId;
      });
    }

    return currentUser;
  }
}
