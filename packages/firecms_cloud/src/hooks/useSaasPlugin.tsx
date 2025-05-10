import React from "react";
import { FireCMSPlugin, useNavigationController } from "@firecms/core";
import { CollectionsConfigController } from "@firecms/collection_editor";
import { Typography } from "@firecms/ui";
import { ProjectConfig } from "./useBuildProjectConfig";
import { TextSearchInfoDialog } from "../components/subscriptions/TextSearchInfoDialog";
import { FireCMSAppConfig, FireCMSBackend } from "../types";
import { RootCollectionSuggestions } from "../components/RootCollectionSuggestions";
import { DataTalkSuggestions } from "../components/DataTalkSuggestions";
import { AutoSetUpCollectionsButton } from "../components/AutoSetUpCollectionsButton";

export function useSaasPlugin({
                                  projectConfig,
                                  collectionConfigController,
                                  appConfig,
                                  dataTalkSuggestions,
                                  introMode,
                                  fireCMSBackend,
                                  onAnalyticsEvent
                              }: {
    projectConfig: ProjectConfig;
    appConfig?: FireCMSAppConfig;
    collectionConfigController: CollectionsConfigController;
    dataTalkSuggestions?: string[];
    introMode?: "new_project" | "existing_project";
    fireCMSBackend: FireCMSBackend;
    onAnalyticsEvent?: (event: string, data?: object) => void;
}): FireCMSPlugin {

    const hasOwnTextSearchImplementation = Boolean(appConfig?.textSearchControllerBuilder);

    const additionalChildrenStart = <>
        {introMode ? <IntroWidget
            fireCMSBackend={fireCMSBackend}
            onAnalyticsEvent={onAnalyticsEvent}
            introMode={introMode}
            projectConfig={projectConfig}/> : undefined}
    </>;

    const additionalChildrenEnd = <>
        {!introMode && <DataTalkSuggestions
            suggestions={dataTalkSuggestions}
            onAnalyticsEvent={onAnalyticsEvent}/>}
        <RootCollectionSuggestions introMode={introMode}
                                   onAnalyticsEvent={onAnalyticsEvent}
        />
    </>;

    return {
        key: "saas",
        homePage: {
            additionalChildrenStart,
            additionalChildrenEnd,
        },
        collectionView: {

            blockSearch: ({
                              context,
                              path,
                              collection,
                              parentCollectionIds
                          }) => {
                return !(projectConfig.localTextSearchEnabled && collection.textSearchEnabled);
            },

            showTextSearchBar: ({
                                    context,
                                    path,
                                    collection
                                }) => {
                if (collection.textSearchEnabled === false) {
                    return false;
                }
                return true;
            },
            onTextSearchClick: ({
                                    context,
                                    path,
                                    collection,
                                    parentCollectionIds
                                }) => {

                const canSearch = projectConfig.localTextSearchEnabled && collection.textSearchEnabled;
                if (!canSearch) {
                    if (parentCollectionIds === undefined) {
                        console.warn("Enabling text search: Parent collection ids are undefined")
                    } else {
                        context.dialogsController.open({
                            key: "text_search_info",
                            Component: (props) => <TextSearchInfoDialog {...props}
                                                                        hasOwnTextSearchImplementation={hasOwnTextSearchImplementation}
                                                                        collectionConfigController={collectionConfigController}
                                                                        parentCollectionIds={parentCollectionIds}
                                                                        path={path}
                                                                        collection={collection}/>
                        });
                    }
                }
                return Promise.resolve(false);
            }
        }
    }
}

export function IntroWidget({
                                introMode,
                                fireCMSBackend,
                                projectConfig,
                                onAnalyticsEvent
                            }: {
    introMode?: "new_project" | "existing_project";
    fireCMSBackend: FireCMSBackend;
    projectConfig: ProjectConfig;
    onAnalyticsEvent?: (event: string, data?: object) => void;
}) {

    const {
        projectsApi
    } = fireCMSBackend;

    const navigation = useNavigationController();
    if (!navigation.topLevelNavigation)
        throw Error("Navigation not ready in FireCMSHomePage");

    return (
        <div className={"mt-8 flex flex-col p-2"}>
            <Typography variant={"h4"} className="mb-4">Welcome</Typography>
            <Typography paragraph={true}>Your admin panel is ready ✌️</Typography>

            {introMode === "existing_project" && <>
                <Typography paragraph={true} className={"mt-4"}>
                    FireCMS Cloud is able to automatically set up collections for you, using the data you have in your
                    database and AI. This might take a few minutes, but it will save you a lot of time.
                </Typography>

                <AutoSetUpCollectionsButton projectId={projectConfig.projectId}
                                            projectsApi={fireCMSBackend.projectsApi}
                                            onClick={() => onAnalyticsEvent?.("intro_cols_setup_click")}
                                            onSuccess={() => onAnalyticsEvent?.("intro_cols_setup_success")}
                                            onNoCollections={() => onAnalyticsEvent?.("intro_cols_setup_no_cols")}
                                            onError={() => onAnalyticsEvent?.("intro_cols_setup_error")}
                />
            </>}

            <Typography paragraph={true} className={"mt-4"}>
                FireCMS can be used as a standalone admin panel but it shines when you add your own custom
                functionality. Including your own custom components, fields, actions, views, and more.
            </Typography>
            <div className={"mb-8"}>
                <Typography className={"inline"}>Start customizing with:</Typography>
                <div
                    className={"ml-2 select-all font-mono bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-white p-2 px-3  border-surface-200 border-solid w-fit text-md font-bold inline-flex rounded-md"}>
                    yarn create firecms-app
                </div>
                <Typography>More info in the <a
                    href={"https://firecms.co/docs/cloud/quickstart"}
                    rel="noopener noreferrer"
                    target="_blank">docs</a></Typography>
            </div>

        </div>
    );
}
