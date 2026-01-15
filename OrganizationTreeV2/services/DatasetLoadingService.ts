/**
 * DatasetLoadingService - Centralized dataset loading logic for PCF controls
 *
 * Handles:
 * - Checking dataset readiness (loading state, pagination)
 * - Loading all pages of a dataset with timeout protection
 * - Providing comprehensive loading status for multiple datasets
 */

export interface LoadingStatus {
  organizationReady: boolean;
  surveysReady: boolean;
  responsesReady: boolean;
  allReady: boolean;
  error: string | null;
}

export interface SingleDatasetStatus {
  isReady: boolean;
  isLoading: boolean;
  hasMorePages: boolean;
  recordCount: number;
}

export class DatasetLoadingService {
  private static readonly TIMEOUT_MS = 30000;
  private static readonly PAGE_DELAY_MS = 150;

  /**
   * Check if a single dataset is fully loaded and ready to use
   */
  public static isDatasetReady(
    dataSet: ComponentFramework.PropertyTypes.DataSet | undefined
  ): boolean {
    if (!dataSet) return false;
    if (dataSet.loading) return false;
    if (dataSet.paging?.hasNextPage) return false;
    return true;
  }

  /**
   * Get detailed status for a single dataset
   */
  public static getDatasetStatus(
    dataSet: ComponentFramework.PropertyTypes.DataSet | undefined
  ): SingleDatasetStatus {
    if (!dataSet) {
      return {
        isReady: false,
        isLoading: false,
        hasMorePages: false,
        recordCount: 0,
      };
    }

    return {
      isReady: this.isDatasetReady(dataSet),
      isLoading: Boolean(dataSet.loading),
      hasMorePages: Boolean(dataSet.paging?.hasNextPage),
      recordCount: dataSet.sortedRecordIds?.length ?? 0,
    };
  }

  /**
   * Check if dataset has any records (even if still loading more)
   */
  public static hasRecords(
    dataSet: ComponentFramework.PropertyTypes.DataSet | undefined
  ): boolean {
    return (dataSet?.sortedRecordIds?.length ?? 0) > 0;
  }

  /**
   * Trigger loading of next page if available
   * Returns true if load was triggered, false if no more pages
   */
  public static triggerNextPage(
    dataSet: ComponentFramework.PropertyTypes.DataSet | undefined
  ): boolean {
    if (!dataSet?.paging?.hasNextPage || !dataSet.paging.loadNextPage) {
      return false;
    }

    dataSet.paging.loadNextPage();
    return true;
  }

  /**
   * Get comprehensive loading status for all three datasets
   */
  public static getLoadingStatus(
    organizationDataSet?: ComponentFramework.PropertyTypes.DataSet,
    surveysDataSet?: ComponentFramework.PropertyTypes.DataSet,
    responsesDataSet?: ComponentFramework.PropertyTypes.DataSet
  ): LoadingStatus {
    const organizationReady = this.isDatasetReady(organizationDataSet);
    const surveysReady = this.isDatasetReady(surveysDataSet);
    const responsesReady = this.isDatasetReady(responsesDataSet);

    return {
      organizationReady,
      surveysReady,
      responsesReady,
      allReady: organizationReady && surveysReady && responsesReady,
      error: null,
    };
  }

  /**
   * Check if any dataset is currently loading
   */
  public static isAnyLoading(
    organizationDataSet?: ComponentFramework.PropertyTypes.DataSet,
    surveysDataSet?: ComponentFramework.PropertyTypes.DataSet,
    responsesDataSet?: ComponentFramework.PropertyTypes.DataSet
  ): boolean {
    return (
      Boolean(organizationDataSet?.loading) ||
      Boolean(surveysDataSet?.loading) ||
      Boolean(responsesDataSet?.loading)
    );
  }

  /**
   * Check if any dataset has more pages to load
   */
  public static hasAnyMorePages(
    organizationDataSet?: ComponentFramework.PropertyTypes.DataSet,
    surveysDataSet?: ComponentFramework.PropertyTypes.DataSet,
    responsesDataSet?: ComponentFramework.PropertyTypes.DataSet
  ): boolean {
    return (
      Boolean(organizationDataSet?.paging?.hasNextPage) ||
      Boolean(surveysDataSet?.paging?.hasNextPage) ||
      Boolean(responsesDataSet?.paging?.hasNextPage)
    );
  }

  /**
   * Get timeout value in milliseconds
   */
  public static getTimeoutMs(): number {
    return this.TIMEOUT_MS;
  }

  /**
   * Get page delay value in milliseconds
   */
  public static getPageDelayMs(): number {
    return this.PAGE_DELAY_MS;
  }
}
