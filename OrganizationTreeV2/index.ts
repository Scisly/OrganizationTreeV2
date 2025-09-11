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

    // Callback dla wymuszenia odĹ›wieĹĽenia widoku po zmianie ankiety
    const handleSurveyChange = () => {
      this.notifyOutputChanged();
    };

    // Callback dla otwarcia ankiety
    const handleSurveyClick = (personId: string, fullSurveyUrl: string) => {
      // OtwĂłrz ankietÄ™ w nowym oknie/tab
      if (fullSurveyUrl) {
        window.open(fullSurveyUrl, "_blank", "noopener,noreferrer");
      }
    };

    // Callback dla wyÅ›wietlenia odpowiedzi - XRM.NAVIGATION.NAVIGATETO MODAL DIALOG IMPLEMENTATION
    const handleResponseClick = (responseId: string) => {
      console.log("Opening survey response modal using Xrm.Navigation.navigateTo:", responseId);
      
      if (responseId) {
        try {
          // Check if global Xrm object is available (Client API)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          const xrmNav = (window as any).Xrm?.Navigation;
          
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (xrmNav?.navigateTo) {
            console.log("Using Xrm.Navigation.navigateTo for modal dialog");
            
            // Use Xrm.Navigation.navigateTo to open existing record in dialog
            const pageInput = {
              pageType: "entityrecord",
              entityName: "msfp_surveyresponse",
              entityId: responseId
            };
            
            const navigationOptions = {
              target: 2, // Open in dialog
              height: { value: 80, unit: "%" },
              width: { value: 70, unit: "%" },
              position: 1 // Center
            };
            
            console.log("Calling Xrm.Navigation.navigateTo with:", { pageInput, navigationOptions });
            
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            void xrmNav.navigateTo(pageInput, navigationOptions).then(
              (success: unknown) => {
                console.log("Modal dialog opened successfully with navigateTo:", success);
                return success;
              },
              (error: unknown) => {
                console.error("Error opening dialog with navigateTo:", error);
                
                // Fallback to PCF openForm
                console.log("Falling back to PCF openForm");
                fallbackToOpenForm(responseId, context);
              }
            );
          } else {
            console.warn("Xrm.Navigation.navigateTo not available, using PCF openForm");
            fallbackToOpenForm(responseId, context);
          }
        } catch (error) {
          console.error("Error using Xrm.Navigation.navigateTo:", error);
          fallbackToOpenForm(responseId, context);
        }
      } else {
        console.warn("Missing responseId:", responseId);
      }
    };

    // Helper method for fallback to PCF openForm
    const fallbackToOpenForm = (responseId: string, context: ComponentFramework.Context<IInputs>) => {
      if (responseId && context.navigation) {
        try {
          const formOptions: ComponentFramework.NavigationApi.EntityFormOptions = {
            entityName: 'msfp_surveyresponse',
            entityId: responseId,
            openInNewWindow: false,
            height: 600,
            width: 1200
          };
          
          console.log("Fallback: Calling PCF openForm with formOptions:", formOptions);
          
          context.navigation.openForm(formOptions).then(
            (success) => {
              console.log("Fallback: PCF openForm successful:", success);
              return success;
            }
          ).catch(
            (error) => {
              console.error("Fallback: PCF openForm failed:", error);
              
              // Final fallback to window.open
              const fallbackUrl = `/main.aspx?etn=msfp_surveyresponse&id=${responseId}&newWindow=true&pagetype=entityrecord`;
              console.log("Final fallback: Using window.open with URL:", fallbackUrl);
              window.open(fallbackUrl, "_blank", "noopener,noreferrer");
            }
          );
        } catch (error) {
          console.error("Fallback: Error with PCF openForm:", error);
          
          // Final fallback to window.open
          const fallbackUrl = `/main.aspx?etn=msfp_surveyresponse&id=${responseId}&newWindow=true&pagetype=entityrecord`;
          console.log("Final fallback: Using window.open with URL:", fallbackUrl);
          window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        }
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
