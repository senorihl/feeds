import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";
import {useUser, useFirebaseApp} from "./utils/firebase";
import {store} from "./app/store";
import {doc, setDoc, getDoc} from "firebase/firestore";
import {Feed, mergeFeeds} from "./app/slice/feeds";

const App: React.FC = () => {
    const user = useUser();
    const {store: firestore} = useFirebaseApp();

    React.useEffect(() => store.subscribe(async () => {
        if (user) {
            const {feeds: current, lastUpdate} = store.getState().feeds;
            const saved = await getDoc<typeof current>(doc(firestore, user.uid, 'feeds'));
            const hasDiff = saved.data()?.lastUpdate !== lastUpdate;
            const totalItems = Object.keys(current).reduce((acc, key) => {
                if (typeof current[key] === 'object') {
                    acc += current[key].items.length;
                }

                return acc;
            }, 0);

            if (!saved.exists() || hasDiff) {
                if (totalItems > 0) {
                    await setDoc(doc(firestore, user.uid, 'feeds'), {
                        lastUpdate,
                        ...current,
                    }, {merge: true});
                } else {
                    await setDoc(doc(firestore, user.uid, 'feeds'), {lastUpdate});
                }
            }

            if (hasDiff) {
                store.dispatch(mergeFeeds(saved.data() as {[url: string]: Feed} & { lastUpdate: number }))
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
