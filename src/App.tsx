import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {RouterProvider} from "react-router-dom";
import {router} from "./router";

import {
    defaultTheme,
    ThemeProvider,
    Preflight,
} from '@xstyled/styled-components'

const theme = {
    ...defaultTheme,
    // Customize your theme here
}

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Preflight/>
            <HelmetProvider>
                <Helmet titleTemplate={"%s | Feeds"}></Helmet>
                <RouterProvider router={router}/>
            </HelmetProvider>
        </ThemeProvider>
    )
};

export default App;
