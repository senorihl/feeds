import React from "react";
import { Helmet } from "react-helmet-async";
import { useItems } from "../app/hooks";
import {FeedGrid} from "../features/FeedGrid";

export const Home: React.FC = () => {
  const items = useItems();

  return (
    <div className="container-fluid">
      <Helmet>
        <title>Yours</title>
      </Helmet>
      <FeedGrid items={items} id={"main-list"} />
    </div>
  );
};
