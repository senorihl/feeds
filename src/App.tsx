import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";

const App: React.FC = () => {
    return (
        <HelmetProvider>
            <Helmet titleTemplate={"%s | Feeds"}></Helmet>
            <RouterProvider router={router}/>
        </HelmetProvider>
    )
};

export default App;
