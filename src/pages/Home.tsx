import React from "react";
import { Helmet } from "react-helmet-async";
import {useAppDispatch, useItems} from "../app/hooks";
import {FeedGrid} from "../features/FeedGrid";
import {refreshFeeds} from "../app/slice/feeds";

export const Home: React.FC = () => {
    const dispatch = useAppDispatch();
  const items = useItems();

  return (
    <div className="container-fluid">
      <Helmet>
        <title>Yours</title>
      </Helmet>
        <div className={"row mb-3 text-center"}>
            <div className={"col"}>
                <button onClick={() => dispatch(refreshFeeds() as any)}  type="button" className="btn btn-outline-dark">Refresh feed <i className="bi bi-arrow-repeat"></i></button>
            </div>
        </div>

        <FeedGrid items={items} id={"main-list"} />
    </div>
  );
};
