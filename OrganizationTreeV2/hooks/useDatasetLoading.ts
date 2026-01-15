import * as React from "react";
import {
  DatasetLoadingService,
  LoadingStatus,
} from "../services/DatasetLoadingService";

export interface UseDatasetLoadingResult extends LoadingStatus {
  isInitialLoading: boolean;
  isPaginating: boolean;
  hasOrganizationData: boolean;
  hasSurveysData: boolean;
  hasResponsesData: boolean;
}

/**
 * Hook for managing dataset loading state and pagination
 *
 * Handles:
 * - Tracking loading status for all three datasets
 * - Automatically triggering pagination when datasets have more pages
 * - Providing clear loading states for UI rendering
 */
export function useDatasetLoading(
  organizationDataSet: ComponentFramework.PropertyTypes.DataSet | undefined,
  surveysDataSet: ComponentFramework.PropertyTypes.DataSet | undefined,
  responsesDataSet: ComponentFramework.PropertyTypes.DataSet | undefined
): UseDatasetLoadingResult {
  const [isPaginating, setIsPaginating] = React.useState(false);
  const paginationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadStartTimeRef = React.useRef<number>(Date.now());

  // Get current loading status from service
  const loadingStatus = React.useMemo(
    () =>
      DatasetLoadingService.getLoadingStatus(
        organizationDataSet,
        surveysDataSet,
        responsesDataSet
      ),
    [
      organizationDataSet?.loading,
      organizationDataSet?.paging?.hasNextPage,
      organizationDataSet?.sortedRecordIds?.length,
      surveysDataSet?.loading,
      surveysDataSet?.paging?.hasNextPage,
      surveysDataSet?.sortedRecordIds?.length,
      responsesDataSet?.loading,
      responsesDataSet?.paging?.hasNextPage,
      responsesDataSet?.sortedRecordIds?.length,
    ]
  );

  // Check if any dataset has records
  const hasOrganizationData = DatasetLoadingService.hasRecords(organizationDataSet);
  const hasSurveysData = DatasetLoadingService.hasRecords(surveysDataSet);
  const hasResponsesData = DatasetLoadingService.hasRecords(responsesDataSet);

  // Effect to handle pagination for all datasets
  React.useEffect(() => {
    const hasMorePages = DatasetLoadingService.hasAnyMorePages(
      organizationDataSet,
      surveysDataSet,
      responsesDataSet
    );

    const isAnyLoading = DatasetLoadingService.isAnyLoading(
      organizationDataSet,
      surveysDataSet,
      responsesDataSet
    );

    // Check for timeout
    const elapsed = Date.now() - loadStartTimeRef.current;
    if (elapsed > DatasetLoadingService.getTimeoutMs()) {
      console.warn("Dataset loading timeout exceeded");
      setIsPaginating(false);
      return;
    }

    // If there are more pages and nothing is currently loading, trigger next page
    if (hasMorePages && !isAnyLoading) {
      setIsPaginating(true);

      // Clear any existing timeout
      if (paginationTimeoutRef.current) {
        clearTimeout(paginationTimeoutRef.current);
      }

      // Delay before loading next page to avoid overwhelming the system
      paginationTimeoutRef.current = setTimeout(() => {
        // Trigger pagination for each dataset that has more pages
        DatasetLoadingService.triggerNextPage(organizationDataSet);
        DatasetLoadingService.triggerNextPage(surveysDataSet);
        DatasetLoadingService.triggerNextPage(responsesDataSet);
      }, DatasetLoadingService.getPageDelayMs());
    } else if (!hasMorePages && !isAnyLoading) {
      setIsPaginating(false);
    }

    return () => {
      if (paginationTimeoutRef.current) {
        clearTimeout(paginationTimeoutRef.current);
      }
    };
  }, [
    organizationDataSet?.paging?.hasNextPage,
    organizationDataSet?.loading,
    surveysDataSet?.paging?.hasNextPage,
    surveysDataSet?.loading,
    responsesDataSet?.paging?.hasNextPage,
    responsesDataSet?.loading,
  ]);

  // Reset load start time when all data is loaded
  React.useEffect(() => {
    if (loadingStatus.allReady) {
      loadStartTimeRef.current = Date.now();
    }
  }, [loadingStatus.allReady]);

  // Determine if this is initial loading (no data yet)
  const isInitialLoading = React.useMemo(() => {
    const isAnyLoading = DatasetLoadingService.isAnyLoading(
      organizationDataSet,
      surveysDataSet,
      responsesDataSet
    );
    const hasAnyData = hasOrganizationData || hasSurveysData || hasResponsesData;

    return isAnyLoading && !hasAnyData;
  }, [
    organizationDataSet?.loading,
    surveysDataSet?.loading,
    responsesDataSet?.loading,
    hasOrganizationData,
    hasSurveysData,
    hasResponsesData,
  ]);

  return {
    ...loadingStatus,
    isInitialLoading,
    isPaginating,
    hasOrganizationData,
    hasSurveysData,
    hasResponsesData,
  };
}
