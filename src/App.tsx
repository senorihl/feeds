import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";
import {useUser, useFirebaseApp} from "./utils/firebase";
import {store} from "./app/store";
import {doc, setDoc, getDoc} from "firebase/firestore";
import {Feed, __rawAddFeed,refreshFeeds} from "./app/slice/feeds";
import {unionBy} from "lodash";

const App: React.FC = () => {
    const user = useUser();
    const {store: firestore} = useFirebaseApp();

    React.useEffect(() => store.subscribe(async () => {
        if (user) {
            const {feeds: current} = store.getState().feeds;
            const snpsht = await getDoc(doc(firestore, user.uid, 'feeds'));
            const saved = ((snpsht.data() as {feeds?: Array<Omit<Feed, 'items'>>})?.feeds || []).reduce((acc, item) => {
                if (typeof item === 'object' && typeof item.url === "string") {
                    acc.push(item)
                }
                return acc;
            }, [] as Array<Omit<Feed, 'items'>>);

            const feeds = Object.keys(current).reduce((acc, key) => {
                if (typeof current[key] === 'object' && typeof current[key].url === "string") {
                    const {items, ...lightweight} = current[key];
                    acc.push(lightweight)
                }
                return acc;
            }, [] as Array<Omit<Feed, 'items'>>);

            const unionned = unionBy(feeds, saved, 'url');

            const hasDiff = JSON.stringify(unionned) !== JSON.stringify(saved);

            if (!snpsht.exists()) {
                await setDoc(doc(firestore, user.uid, 'feeds'), {feeds: unionned});
                return;
            }

            if (hasDiff) {
                await setDoc(doc(firestore, user.uid, 'feeds'), {feeds: unionned});
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

    }), [user])


    return (
        <HelmetProvider>
            <Helmet titleTemplate={"%s | Feeds"}></Helmet>
            <RouterProvider router={router}/>
        </HelmetProvider>
    )
};

export default App;
