/**
 * SurveyAccessService - Serwis weryfikacji uprawnień dostępu do ankiet
 *
 * Reguły biznesowe:
 * - Etap 1 (Samoocena): 
 *   - Blue collar: Supervisor wypełnia za pracownika (EDIT)
 *   - Non-blue collar: Pracownik wypełnia sam, Supervisor tylko podgląd (VIEW) jeśli wypełnione
 * - Etap 2 i 3 (Ocena Managerska): 
 *   - Supervisor może wypełnić TYLKO po ukończeniu poprzedniego etapu (łańcuchowa logika)
 */

import {
  SurveyStage,
  SurveyAccessLevel,
  SurveyAccessResult,
  UserContext,
  OrganizationPerson,
  SurveyResponse,
  Survey,
} from "../types/OrganizationTypes";
import { OrganizationService } from "./OrganizationService";

export class SurveyAccessService {
  // Cache for normalized GUIDs to avoid repeated regex operations
  private static guidCache = new Map<string, string>();
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Normalizuje GUID do jednolitego formatu (małe litery, bez nawiasów klamrowych i myślników)
   * Uses caching to avoid repeated regex operations
   */
  public static normalizeGuid(guid: string | undefined): string {
    if (!guid) return "";

    // Check cache first
    const cached = this.guidCache.get(guid);
    if (cached !== undefined) {
      return cached;
    }

    // Normalize and cache
    const normalized = guid.replace(/[{}-]/g, "").toLowerCase();

    // Limit cache size to prevent memory issues
    if (this.guidCache.size >= this.MAX_CACHE_SIZE) {
      // Clear oldest entries (simple approach: clear half the cache)
      const entries = Array.from(this.guidCache.entries());
      this.guidCache.clear();
      entries.slice(Math.floor(entries.length / 2)).forEach(([k, v]) => {
        this.guidCache.set(k, v);
      });
    }

    this.guidCache.set(guid, normalized);
    return normalized;
  }

  /**
   * Clears the GUID cache (useful for testing or memory management)
   */
  public static clearGuidCache(): void {
    this.guidCache.clear();
  }

  /**
   * Porównuje dwa GUID-y z normalizacją
   */
  public static compareGuids(
    guid1: string | undefined,
    guid2: string | undefined
  ): boolean {
    return this.normalizeGuid(guid1) === this.normalizeGuid(guid2);
  }

  /**
   * Wykrywa etap ankiety na podstawie nazwy
   * Rozpoznaje wzorce: "Stage 1", "Stage 2", "Stage 3", "Etap 1", "Etap 2", "Etap 3"
   */
  public static detectSurveyStage(surveyName: string): SurveyStage | null {
    const lowerName = surveyName.toLowerCase();

    if (lowerName.includes("stage 1") || lowerName.includes("etap 1")) {
      return 1;
    }
    if (lowerName.includes("stage 2") || lowerName.includes("etap 2")) {
      return 2;
    }
    if (lowerName.includes("stage 3") || lowerName.includes("etap 3")) {
      return 3;
    }

    // Domyślnie traktuj jako Stage 1 (najbardziej permisywny)
    return null;
  }

  /**
   * Buduje kontekst użytkownika na podstawie danych z datasetu
   */
  public static buildUserContext(
    userId: string,
    allPeople: OrganizationPerson[]
  ): UserContext {
    // Znajdź osobę odpowiadającą zalogowanemu użytkownikowi
    const userPerson = allPeople.find((person) =>
      this.compareGuids(person.ag_userid, userId)
    );

    const userPersonId = userPerson?.id;
    const directSubordinateIds: string[] = [];
    const allSubordinateIds: string[] = [];

    if (userPersonId) {
      // Znajdź bezpośrednich podwładnych
      allPeople.forEach((person) => {
        if (person.managerId === userPersonId) {
          directSubordinateIds.push(person.id);
        }
      });

      // Znajdź wszystkich podwładnych (bezpośrednich i pośrednich)
      this.collectAllSubordinates(userPersonId, allPeople, allSubordinateIds);
    }

    return {
      userId,
      userPersonId,
      directSubordinateIds,
      allSubordinateIds,
    };
  }

  /**
   * Rekurencyjnie zbiera wszystkich podwładnych (bezpośrednich i pośrednich)
   */
  private static collectAllSubordinates(
    managerId: string,
    allPeople: OrganizationPerson[],
    result: string[],
    visited = new Set<string>()
  ): void {
    // Zabezpieczenie przed cyklami w hierarchii
    if (visited.has(managerId)) return;
    visited.add(managerId);

    allPeople.forEach((person) => {
      if (person.managerId === managerId && !result.includes(person.id)) {
        result.push(person.id);
        // Rekurencyjnie dodaj podwładnych tego podwładnego
        this.collectAllSubordinates(person.id, allPeople, result, visited);
      }
    });
  }

  /**
   * Główna funkcja weryfikacji dostępu do ankiety z obsługą łańcuchową etapów
   *
   * @param stage - Etap ankiety (1, 2 lub 3)
   * @param nodePersonId - ID osoby, dla której sprawdzamy dostęp (węzeł w drzewie)
   * @param userContext - Kontekst zalogowanego użytkownika
   * @param hasExistingResponse - Czy istnieje już odpowiedź na ankietę dla tego węzła
   * @param allSurveyResponses - Wszystkie odpowiedzi z ankiet (do weryfikacji etapów)
   * @param surveys - Lista wszystkich ankiet (do identyfikacji etapów)
   * @param nodePersonEmail - Email osoby (do sprawdzenia blue collar)
   * @returns Wynik weryfikacji z poziomem dostępu i wyjaśnieniem
   */
  public static getSurveyAccessLevel(
    stage: SurveyStage | null,
    nodePersonId: string,
    userContext: UserContext,
    hasExistingResponse: boolean,
    allSurveyResponses?: SurveyResponse[],
    surveys?: Survey[],
    nodePersonEmail?: string
  ): SurveyAccessResult {
    const { userPersonId, directSubordinateIds, allSubordinateIds } =
      userContext;

    // Sprawdź czy węzeł należy do zalogowanego użytkownika (self)
    const isSelf = userPersonId === nodePersonId;

    // Sprawdź czy węzeł należy do bezpośredniego podwładnego
    const isDirectSubordinate = directSubordinateIds.includes(nodePersonId);

    // Sprawdź czy węzeł należy do dowolnego podwładnego (bezpośredniego lub pośredniego)
    const isAnySubordinate = allSubordinateIds.includes(nodePersonId);

    // Sprawdź czy pracownik jest blue collar
    const isBlueCollar = OrganizationService.isBlueCollarEmail(nodePersonEmail);

    // Jeśli nie wykryto etapu, traktuj jak Stage 1 (domyślne zachowanie)
    const effectiveStage = stage ?? 1;

    // ============================================
    // ETAP 1 - Samoocena
    // ============================================
    if (effectiveStage === 1) {
      if (isSelf) {
        // Użytkownik może edytować własną samoocenę
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Możesz przeglądać swoją odpowiedź",
          };
        }
        return {
          accessLevel: "edit",
          reason: "Wypełnij swoją samoocenę",
        };
      }

      if (isDirectSubordinate) {
        // Dla blue collar: Supervisor wypełnia ankietę
        if (isBlueCollar) {
          if (hasExistingResponse) {
            return {
              accessLevel: "view",
              reason: "Podgląd wypełnionej samooceny pracownika",
            };
          }
          return {
            accessLevel: "edit",
            reason: "Wypełnij samoocenę za pracownika (blue collar)",
          };
        }

        // Dla non-blue collar: Supervisor ma tylko podgląd jeśli wypełnione
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd samooceny podwładnego",
          };
        }
        // Brak odpowiedzi - Supervisor nie może wypełnić za pracownika non-blue collar
        return {
          accessLevel: "none",
          reason: "Oczekiwanie na wypełnienie samooceny przez pracownika",
          isChainBlocked: true,
          disabledReason: "Pracownik musi sam wypełnić samoocenę",
        };
      }

      if (isAnySubordinate) {
        // Pośredni podwładny - tylko podgląd jeśli wypełnione
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd samooceny (pośredni podwładny)",
          };
        }
        return {
          accessLevel: "none",
          reason: "Brak dostępu do samooceny pośredniego podwładnego",
        };
      }

      // Brak relacji - brak dostępu
      return {
        accessLevel: "none",
        reason: "Brak uprawnień do tej ankiety",
      };
    }

    // ============================================
    // ETAP 2 - Ocena Managerska (wymaga Etapu 1)
    // ============================================
    if (effectiveStage === 2) {
      if (isSelf) {
        // Pracownik może tylko przeglądać własne oceny managerskie po wypełnieniu
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd oceny od przełożonego",
          };
        }
        return {
          accessLevel: "none",
          reason: "Przełożony nie wypełnił jeszcze oceny",
        };
      }

      if (isDirectSubordinate) {
        // Sprawdź czy Etap 1 został wypełniony
        const stage1Completed = this.isStageCompletedForPerson(
          1,
          nodePersonId,
          allSurveyResponses,
          surveys
        );

        if (!stage1Completed) {
          return {
            accessLevel: "none",
            reason: "Oczekiwanie na wypełnienie Etapu 1",
            isChainBlocked: true,
            disabledReason: "Etap 1 musi zostać wypełniony przed Etapem 2",
          };
        }

        // Etap 1 wypełniony - Supervisor może wypełnić Etap 2
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Przeglądaj ocenę podwładnego",
          };
        }
        return {
          accessLevel: "edit",
          reason: "Wypełnij ocenę podwładnego (Etap 2)",
        };
      }

      if (isAnySubordinate) {
        // Pośredni podwładny - tylko podgląd
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd oceny (pośredni podwładny)",
          };
        }
        return {
          accessLevel: "none",
          reason: "Ocenę wypełnia bezpośredni przełożony",
        };
      }

      return {
        accessLevel: "none",
        reason: "Brak uprawnień do tej ankiety",
      };
    }

    // ============================================
    // ETAP 3 - Ocena Managerska (wymaga Etapu 2)
    // ============================================
    if (effectiveStage === 3) {
      if (isSelf) {
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd oceny od przełożonego",
          };
        }
        return {
          accessLevel: "none",
          reason: "Przełożony nie wypełnił jeszcze oceny",
        };
      }

      if (isDirectSubordinate) {
        // Sprawdź czy Etap 2 został wypełniony
        const stage2Completed = this.isStageCompletedForPerson(
          2,
          nodePersonId,
          allSurveyResponses,
          surveys
        );

        if (!stage2Completed) {
          return {
            accessLevel: "none",
            reason: "Oczekiwanie na wypełnienie Etapu 2",
            isChainBlocked: true,
            disabledReason: "Etap 2 musi zostać wypełniony przed Etapem 3",
          };
        }

        // Etap 2 wypełniony - Supervisor może wypełnić Etap 3
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Przeglądaj ocenę podwładnego",
          };
        }
        return {
          accessLevel: "edit",
          reason: "Wypełnij ocenę podwładnego (Etap 3)",
        };
      }

      if (isAnySubordinate) {
        if (hasExistingResponse) {
          return {
            accessLevel: "view",
            reason: "Podgląd oceny (pośredni podwładny)",
          };
        }
        return {
          accessLevel: "none",
          reason: "Ocenę wypełnia bezpośredni przełożony",
        };
      }

      return {
        accessLevel: "none",
        reason: "Brak uprawnień do tej ankiety",
      };
    }

    // Domyślny przypadek (nie powinien wystąpić)
    return {
      accessLevel: "none",
      reason: "Nieznany etap ankiety",
    };
  }

  /**
   * Sprawdza czy dany etap ankiety został wypełniony dla danej osoby
   */
  private static isStageCompletedForPerson(
    stage: SurveyStage,
    personId: string,
    allSurveyResponses?: SurveyResponse[],
    surveys?: Survey[]
  ): boolean {
    if (!allSurveyResponses || !surveys) {
      return false;
    }

    // Znajdź ankietę dla danego etapu
    const stageSurvey = surveys.find((survey) => {
      const surveyStage = this.detectSurveyStage(survey.msfp_name);
      return surveyStage === stage;
    });

    if (!stageSurvey) {
      return false;
    }

    // Sprawdź czy istnieje odpowiedź dla tej osoby i tej ankiety
    return allSurveyResponses.some(
      (response) =>
        response.personId === personId &&
        response.surveyId === stageSurvey.msfp_surveyid
    );
  }

  /**
   * Uproszczona wersja dla szybkiego sprawdzenia czy pokazać przycisk
   */
  public static shouldShowSurveyButton(
    stage: SurveyStage | null,
    nodePersonId: string,
    userContext: UserContext,
    hasExistingResponse: boolean,
    allSurveyResponses?: SurveyResponse[],
    surveys?: Survey[],
    nodePersonEmail?: string
  ): boolean {
    const result = this.getSurveyAccessLevel(
      stage,
      nodePersonId,
      userContext,
      hasExistingResponse,
      allSurveyResponses,
      surveys,
      nodePersonEmail
    );
    return result.accessLevel !== "none";
  }

  /**
   * Sprawdza czy użytkownik może edytować ankietę (nie tylko przeglądać)
   */
  public static canEditSurvey(
    stage: SurveyStage | null,
    nodePersonId: string,
    userContext: UserContext,
    hasExistingResponse: boolean,
    allSurveyResponses?: SurveyResponse[],
    surveys?: Survey[],
    nodePersonEmail?: string
  ): boolean {
    const result = this.getSurveyAccessLevel(
      stage,
      nodePersonId,
      userContext,
      hasExistingResponse,
      allSurveyResponses,
      surveys,
      nodePersonEmail
    );
    return result.accessLevel === "edit";
  }

  /**
   * Oblicza liczbę zadań do wykonania (ready to fill) dla danej ankiety
   * Używane do wyświetlania Badge w panelu ankiet
   */
  public static calculatePendingTasks(
    survey: Survey,
    userContext: UserContext,
    allPeople: OrganizationPerson[],
    allSurveyResponses: SurveyResponse[],
    surveys: Survey[]
  ): number {
    const { directSubordinateIds } = userContext;
    const surveyStage = this.detectSurveyStage(survey.msfp_name);
    const effectiveStage = surveyStage ?? 1;

    let count = 0;

    for (const subordinateId of directSubordinateIds) {
      const subordinate = allPeople.find((p) => p.id === subordinateId);
      if (!subordinate) continue;

      const isBlueCollar = OrganizationService.isBlueCollarEmail(subordinate.email);

      // Sprawdź czy już jest odpowiedź dla tej ankiety i tej osoby
      const hasResponse = allSurveyResponses.some(
        (r) => r.personId === subordinateId && r.surveyId === survey.msfp_surveyid
      );

      if (hasResponse) continue; // Już wypełnione

      // ========== ETAP 1 ==========
      if (effectiveStage === 1) {
        // Tylko blue collar - Supervisor może wypełnić
        if (isBlueCollar) {
          count++;
        }
        // Non-blue collar nie liczymy - to pracownik wypełnia sam
      }

      // ========== ETAP 2 ==========
      else if (effectiveStage === 2) {
        // Sprawdź czy Etap 1 jest wypełniony
        const stage1Completed = this.isStageCompletedForPerson(
          1,
          subordinateId,
          allSurveyResponses,
          surveys
        );
        if (stage1Completed) {
          count++;
        }
      }

      // ========== ETAP 3 ==========
      else if (effectiveStage === 3) {
        // Sprawdź czy Etap 2 jest wypełniony
        const stage2Completed = this.isStageCompletedForPerson(
          2,
          subordinateId,
          allSurveyResponses,
          surveys
        );
        if (stage2Completed) {
          count++;
        }
      }
    }

    return count;
  }
}
