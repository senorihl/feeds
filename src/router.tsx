import { createHashRouter } from "react-router-dom";
import React from "react";
import { Home } from "./pages/Home";
import { Subscriptions } from "./pages/Subscriptions";
import { PageLayout } from "./PageLayout";
import { Account, SignIn, LogIn } from "./pages/Account";
import { Feed } from "./pages/Feed";

export const router = createHashRouter([
  {
    element: <PageLayout />,
    children: [
      {
        element: <Home />,
        path: "/",
      },
      {
        element: <Feed />,
        path: "/feed/*",
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
