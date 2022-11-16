import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";
import {useUser, useFirebaseApp} from "./utils/firebase";
import {store} from "./app/store";
import {doc, setDoc, getDoc} from "firebase/firestore";
import {Feed, __rawAddFeed,refreshFeeds} from "./app/slice/feeds";
import {sortBy, unionBy, property} from "lodash";

const refreshStateFromFirestore = async (firestore: ReturnType<typeof useFirebaseApp>["store"], user: ReturnType<typeof useUser>) => {
    if (user) {
        const {feeds: current} = store.getState().feeds;
        const snpsht = await getDoc(doc(firestore, user.uid, 'feeds'));
        const saved = sortBy(((snpsht.data() as {feeds?: Array<Omit<Feed, 'items'>>})?.feeds || []).reduce((acc, item) => {
            if (typeof item === 'object' && typeof item.url === "string") {
                const {url, disabled, title, publishedAt, updatedAt, description} = item;
                acc.push({url, disabled, title, publishedAt, updatedAt, description})
            }
            return acc;
        }, [] as Array<Omit<Feed, 'items'>>), property('url'));

        const feeds = sortBy(Object.keys(current).reduce((acc, key) => {
            if (typeof current[key] === 'object' && typeof current[key].url === "string") {
                const {url, disabled, title, publishedAt, updatedAt, description} = current[key];
                acc.push({url, disabled, title, publishedAt, updatedAt, description})
            }
            return acc;
        }, [] as Array<Omit<Feed, 'items'>>), property('url'));

        const unionned = unionBy(feeds, saved, 'url');
        const hasDiff = JSON.stringify(unionned) !== JSON.stringify(saved);

        if (!snpsht.exists()) {
            await setDoc(doc(firestore, user.uid, 'feeds'), {feeds: unionned});
            return;
        }

        if (hasDiff) {
            await setDoc(doc(firestore, user.uid, 'feeds'), {feeds: unionned});
        }

        let missing = false;

        unionned.forEach((item) => {
            if (typeof current[item.url] === 'undefined' && typeof item.url === 'string') {
                store.dispatch(__rawAddFeed(item));
                missing = true;
            }
        });

        if (missing) {
            store.dispatch(refreshFeeds() as any);
        }
    }
}

let displayMode = 'browser';
const mqStandAlone = '(display-mode: standalone)';
// @ts-ignore
if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
    displayMode = 'standalone';
}

const App: React.FC = () => {
    const user = useUser();
    const {store: firestore} = useFirebaseApp();

    React.useEffect(() => {
        refreshStateFromFirestore(firestore, user);
        return store.subscribe(async () => {
            await refreshStateFromFirestore(firestore, user);
        });
    }, [user])


    return (
        <HelmetProvider>
            <Helmet titleTemplate={displayMode === 'browser' ? "%s | Feeds" : "%s"}></Helmet>
            <RouterProvider router={router}/>
        </HelmetProvider>
    )
};

export default App;
