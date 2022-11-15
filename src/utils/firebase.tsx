// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent as nativeLogEvent } from "firebase/analytics";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import React from "react";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDjj84c8EpuSEEHndOzdMgWfUWO23QEgdM",
    authDomain: "feeds-8fd21.firebaseapp.com",
    projectId: "feeds-8fd21",
    storageBucket: "feeds-8fd21.appspot.com",
    messagingSenderId: "353931006966",
    appId: "1:353931006966:web:8f5ee352c47ca8453a6dd7",
    measurementId: "G-31J4VBCEHH"
};

// Initialize Firebase

type LogEventParameters = Parameters<typeof nativeLogEvent>;

export const useFirebaseApp = () => {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const store = getFirestore(app);

    const custom_event = (event_name: LogEventParameters[1], event_params: LogEventParameters[2]) => {
        nativeLogEvent(analytics, event_name, event_params);
    }

    return {app, analytics, auth, store, custom_event};
}

export const PageView: React.FC<{
    page_title?: string;
    page_location?: string;
    page_path?: string;
    [key: string]: any;
}> = (props) => {
    const {analytics} = useFirebaseApp();

    React.useEffect(() => {
        nativeLogEvent(analytics, 'page_view', props);
    }, []);

    return (<></>);
}

export function useUser() {
    const {auth} = useFirebaseApp();
    const [user, setUser] = React.useState<User | null>(auth.currentUser);

    onAuthStateChanged(auth, (user) => {
        setUser(user);
    });

    return user;
}
