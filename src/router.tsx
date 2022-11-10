import {createHashRouter, Outlet} from "react-router-dom";
import React from "react";
import { Home } from "./pages/Home";
import { Subscriptions } from "./pages/Subscriptions";
import {PageLayout} from "./PageLayout";
import {store} from "./app/store";
import {refreshFeeds} from "./app/slice/feeds";

export const router = createHashRouter([
    {
        element: <PageLayout />,
        children: [
            {
                element: <Home />,
                path: "/",
                loader: () => {
                    console.log('Home loader')
                    store.dispatch(refreshFeeds() as any)
                }
            },
            {
                element: <Subscriptions />,
                path: "/subscriptions",
            },
        ]
    },
]);
