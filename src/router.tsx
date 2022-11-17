import { createHashRouter, Outlet } from "react-router-dom";
import React from "react";
import { Home } from "./pages/Home";
import { Subscriptions } from "./pages/Subscriptions";
import { PageLayout } from "./PageLayout";
import { store } from "./app/store";
import { refreshFeeds } from "./app/slice/feeds";
import { Account, SignIn, LogIn } from "./pages/Account";

export const router = createHashRouter([
  {
    element: <PageLayout />,
    children: [
      {
        element: <Home />,
        path: "/",
      },
      {
        element: <Subscriptions />,
        path: "/subscriptions",
      },
      {
        element: <Account />,
        path: "/account",
      },
      {
        element: <SignIn />,
        path: "/sign-in",
      },
      {
        element: <LogIn />,
        path: "/log-in",
      },
    ],
  },
]);
