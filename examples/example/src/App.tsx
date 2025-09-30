import React, { useCallback, useMemo } from "react";

import "typeface-rubik";
import "@fontsource/jetbrains-mono";

import {
    AppBar,
    Authenticator,
    CircularProgressCenter,
    Drawer,
    FireCMS,
    ModeControllerProvider,
    NavigationRoutes,
    Scaffold,
    SideDialogs,
    SnackbarProvider,
    useBuildLocalConfigurationPersistence,
    useBuildModeController,
    useBuildNavigationController,
    useValidateAuthenticator
} from "@firecms/core";

import {
    FirebaseAuthController,
    FirebaseLoginView,
    FirebaseSignInProvider,
    FirebaseUserWrapper,
    useFirebaseAuthController,
    useFirebaseStorageSource,
    useFirestoreDelegate,
    useInitialiseFirebase
} from "@firecms/firebase";

import {
    buildCollectionInference,
    useFirestoreCollectionsConfigController
} from "@firecms/collection_editor_firebase";

import {
    mergeCollections,
    useCollectionEditorPlugin
} from "@firecms/collection_editor";

import {
    useBuildUserManagement,
    useUserManagementPlugin,
    userManagementAdminViews
} from "@firecms/user_management";

import { CenteredView } from "@firecms/ui";
import { demoCollection } from "./collections/demo";
import { firebaseConfig } from "./firebase_config";

function App() {

    /**
     * 🔹 Custom authenticator to control access
     */
    const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(async ({
        user,
        authController
    }) => {

        if (user?.email?.includes("flanders")) {
            throw Error("Stupid Flanders!");
        }

        const idTokenResult = await user?.firebaseUser?.getIdTokenResult();
        const userIsAdmin = idTokenResult?.claims.admin || user?.email?.endsWith("@firecms.co");

        console.log("Allowing access to", user);

        // For now, allow everyone
        return true;
    }, []);

    /**
     * 🔹 Initialize Firebase
     */
    const {
        firebaseApp,
        firebaseConfigLoading,
        configError
    } = useInitialiseFirebase({
        firebaseConfig
    });

    const modeController = useBuildModeController();

    const signInOptions: FirebaseSignInProvider[] = ["google.com", "password"];

    /**
     * 🔹 Authentication controller
     */
    const authController: FirebaseAuthController = useFirebaseAuthController({
        firebaseApp,
        signInOptions
    });

    /**
     * 🔹 Local persistence for user preferences
     */
    const userConfigPersistence = useBuildLocalConfigurationPersistence();

    /**
     * 🔹 Firestore data delegate
     */
    const firestoreDelegate = useFirestoreDelegate({
        firebaseApp
    });

    /**
     * 🔹 Firebase storage
     */
    const storageSource = useFirebaseStorageSource({
        firebaseApp
    });

    /**
     * 🔹 Validate authentication
     */
    const {
        authLoading,
        canAccessMainView,
        notAllowedError
    } = useValidateAuthenticator({
        authController,
        authenticator: myAuthenticator,
        dataSourceDelegate: firestoreDelegate,
        storageSource
    });

    /**
     * 🔹 Firestore collection editor controller
     */
    const collectionConfigController = useFirestoreCollectionsConfigController({ firebaseApp });

    const collectionEditorPlugin = useCollectionEditorPlugin({
        collectionConfigController,
        collectionInference: buildCollectionInference(firebaseApp)
    });

    /**
     * 🔹 User management setup
     */
    const userManagement = useBuildUserManagement({
        dataSourceDelegate: firestoreDelegate,
        authController
    });

    const userManagementPlugin = useUserManagementPlugin({ userManagement });

    /**
     * 🔹 Combine demo collections + dynamic collections
     */
    const collectionsBuilder = useCallback(() => {
        return collectionConfigController.collections ?? [];
    }, [collectionConfigController.collections]);

    /**
     * 🔹 Navigation Controller with Admin Views
     */
    const navigationController = useBuildNavigationController({
        disabled: authLoading,
        collections: collectionsBuilder,
        views: [],
        adminViews: userManagementAdminViews, // ✅ Adds Admin section to sidebar
        authController,
        dataSourceDelegate: firestoreDelegate,
        plugins: [collectionEditorPlugin, userManagementPlugin]
    });

    /**
     * 🔹 Loading / Error handling
     */
    if (firebaseConfigLoading || !firebaseApp) {
        return <CircularProgressCenter />;
    }

    if (configError) {
        return <CenteredView>{configError}</CenteredView>;
    }

    /**
     * 🔹 Main App Rendering
     */
    return (
        <SnackbarProvider>
            <ModeControllerProvider value={modeController}>
                <FireCMS
                    navigationController={navigationController}
                    authController={userManagement}  // use userManagement here
                    userConfigPersistence={userConfigPersistence}
                    dataSourceDelegate={firestoreDelegate}
                    storageSource={storageSource}
                    plugins={[collectionEditorPlugin, userManagementPlugin]}
                >
                    {({
                        context,
                        loading
                    }) => {

                        if (loading || authLoading) {
                            return <CircularProgressCenter size={"large"} />;
                        }

                        if (!canAccessMainView) {
                            return (
                                <FirebaseLoginView
                                    authController={authController}
                                    firebaseApp={firebaseApp}
                                    signInOptions={signInOptions}
                                    notAllowedError={notAllowedError}
                                />
                            );
                        }

                        return (
                            <Scaffold autoOpenDrawer={false}>
                                <AppBar title={"My demo app"} />
                                <Drawer />
                                <NavigationRoutes />
                                <SideDialogs />
                            </Scaffold>
                        );
                    }}
                </FireCMS>
            </ModeControllerProvider>
        </SnackbarProvider>
    );
}

export default App;
