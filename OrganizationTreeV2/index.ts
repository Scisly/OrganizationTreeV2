import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { OrganizationTree } from "./components/OrganizationTree";
import * as React from "react";

export class OrganizationTreeV2
  implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private notifyOutputChanged: () => void;
  private context: ComponentFramework.Context<IInputs>;
  private userId: string;
  private containerWidth: number;
  private containerHeight: number;  

  /**
   * Empty constructor.
   */
  constructor() {
    // Empty
  }

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    context.parameters.organizationDataSet.paging.setPageSize(1500);
    context.parameters.surveyResponsesDataSet.paging.setPageSize(1500);
    context.parameters.surveysDataSet.paging.setPageSize(1500);
    this.containerWidth = context.mode.allocatedWidth;
    this.containerHeight = context.mode.allocatedHeight;
    this.context = context;
    this.userId = context.userSettings.userId;
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   * @returns ReactElement root react element for the control
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    this.context = context;

    // Podstawowe informacje o datasecie dla debugowania
    const recordCount =
      context.parameters.organizationDataSet?.sortedRecordIds?.length ?? 0;
    if (recordCount === 0) {
      console.warn("OrganizationTreeV2: Brak danych w datasecie");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const projectId = (context.parameters.projectId as any)?.raw ?? "";
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const organizationDataSet = context.parameters.organizationDataSet as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const surveyResponsesDataSet = context.parameters.surveyResponsesDataSet as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const surveysDataSet = context.parameters.surveysDataSet as any;

    // Callback dla wymuszenia odświeżenia widoku po zmianie ankiety
    const handleSurveyChange = () => {
      this.notifyOutputChanged();
    };

    // Callback dla otwarcia ankiety
    const handleSurveyClick = (personId: string, fullSurveyUrl: string) => {
      // Otwórz ankietę w nowym oknie/tab
      if (fullSurveyUrl) {
        window.open(fullSurveyUrl, "_blank", "noopener,noreferrer");
      }
    };

    // Callback dla wyświetlenia odpowiedzi
    const handleResponseClick = (responseUrl: string) => {
      // Otwórz odpowiedź w nowym oknie/tab
      if (responseUrl) {
        window.open(responseUrl, "_blank", "noopener,noreferrer");
      }
    };

    return React.createElement(OrganizationTree, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      dataSet: organizationDataSet,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      surveyResponsesDataSet: surveyResponsesDataSet,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      surveysDataSet: surveysDataSet,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      projectId: projectId,
      userId: this.userId,
      onSurveyClick: handleSurveyClick,
      onResponseClick: handleResponseClick,
      onSurveyChange: handleSurveyChange,
    });
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    return {};
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
  }
}
