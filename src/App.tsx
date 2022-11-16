import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useUser } from "./utils/firebase";
import { store } from "./app/store";
import { setUser } from "./app/slice/feeds";

let displayMode = "browser";
const mqStandAlone = "(display-mode: standalone)";
// @ts-ignore
if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
  displayMode = "standalone";
}

const App: React.FC = () => {
  const user = useUser();

  React.useEffect(() => {
    store.dispatch(setUser(user?.uid) as any);
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
