import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useUser, useFirebaseApp } from "./utils/firebase";
import { store } from "./app/store";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Feed, __rawAddFeed, refreshFeeds } from "./app/slice/feeds";
import { sortBy, unionBy, property } from "lodash";

enum PromiseState {
  UNKNOWN,
  PENDING,
  FULFILLED,
  REJECTED,
}

const useFirestoreRefresh: (
  reduxStore: typeof store
) => [
  state: PromiseState,
  refreshStateFromFirestore: (
    firestore: ReturnType<typeof useFirebaseApp>["store"],
    user: ReturnType<typeof useUser>
  ) => Promise<void>
] = (reduxStore) => {
  const [state, setState] = React.useState<PromiseState>(PromiseState.UNKNOWN);

  const refreshStateFromFirestore = async (
    firestore: ReturnType<typeof useFirebaseApp>["store"],
    user: ReturnType<typeof useUser>
  ) => {
    if (user) {
      setState(PromiseState.PENDING);
      try {
        const { feeds: current } = reduxStore.getState().feeds;
        const snpsht = await getDoc(doc(firestore, user.uid, "feeds"));
        const saved = sortBy(
          (
            (snpsht.data() as { feeds?: Array<Omit<Feed, "items">> })?.feeds ||
            []
          ).reduce((acc, item) => {
            if (typeof item === "object" && typeof item.url === "string") {
              const {
                url,
                disabled,
                title,
                publishedAt,
                updatedAt,
                description,
              } = item;
              acc.push({
                url,
                disabled,
                title,
                publishedAt,
                updatedAt,
                description,
              });
            }
            return acc;
          }, [] as Array<Omit<Feed, "items">>),
          property("url")
        );

        const feeds = sortBy(
          Object.keys(current).reduce((acc, key) => {
            if (
              typeof current[key] === "object" &&
              typeof current[key].url === "string"
            ) {
              const {
                url,
                disabled,
                title,
                publishedAt,
                updatedAt,
                description,
              } = current[key];
              acc.push({
                url,
                disabled,
                title,
                publishedAt,
                updatedAt,
                description,
              });
            }
            return acc;
          }, [] as Array<Omit<Feed, "items">>),
          property("url")
        );

        const unionned = unionBy(feeds, saved, "url").map<
          Pick<Feed, "title" | "url" | "disabled">
        >((item) => {
          const { title, url, disabled = false } = item;
          return { title, url, disabled };
        });

        const hasDiff = JSON.stringify(unionned) !== JSON.stringify(saved);

        if (!snpsht.exists()) {
          await setDoc(doc(firestore, user.uid, "feeds"), { feeds: unionned });
          setState(PromiseState.FULFILLED);
          return;
        }

        if (hasDiff) {
          await setDoc(doc(firestore, user.uid, "feeds"), { feeds: unionned });
        }

        let missing = false;

        unionned.forEach((item) => {
          if (
            typeof current[item.url] === "undefined" &&
            typeof item.url === "string"
          ) {
            reduxStore.dispatch(
              __rawAddFeed({ ...item, publishedAt: new Date() })
            );
            missing = true;
          }
        });

        if (missing) {
          reduxStore.dispatch(refreshFeeds() as any);
        }

        setState(PromiseState.FULFILLED);
      } catch {
        setState(PromiseState.REJECTED);
      }
    }
  };

  return [state, refreshStateFromFirestore];
};

let displayMode = "browser";
const mqStandAlone = "(display-mode: standalone)";
// @ts-ignore
if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
  displayMode = "standalone";
}

const App: React.FC = () => {
  const user = useUser();
  const { store: firestore } = useFirebaseApp();
  const [refreshState, refreshStateFromFirestore] = useFirestoreRefresh(store);

  React.useEffect(() => {
    refreshState !== PromiseState.PENDING &&
      refreshStateFromFirestore(firestore, user);
    return store.subscribe(() => {
      refreshState !== PromiseState.PENDING &&
        refreshStateFromFirestore(firestore, user);
    });
  }, [user]);

  return (
    <HelmetProvider>
      <Helmet
        titleTemplate={displayMode === "browser" ? "%s | Feeds" : "%s"}
      ></Helmet>
      <RouterProvider router={router} />
    </HelmetProvider>
  );
};

export default App;
