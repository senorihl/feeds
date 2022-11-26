import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import PullToRefresh from "react-simple-pull-to-refresh";
import styled from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useItems,
  useLastUpdate,
} from "../app/hooks";
import { FetchState, refreshFeeds } from "../app/slice/feeds";
import { ActivityIndicator } from "../components/ActivityIndicator";
import { FeedGrid } from "../features/FeedGrid";
import { PageView, useFirebaseApp } from "../utils/firebase";

const TopStickyContainer = styled.div`
  background-color: gray-200;
`;

export const Feed: React.FC = () => {
  const dispatch = useAppDispatch();
  const { custom_event } = useFirebaseApp();
  const { "*": feed_url } = useParams();
  const isFetching = useAppSelector(
    (state) => state.feeds.state === FetchState.FETCHING
  );
  const items = useItems(feed_url);
  const lastUpdate = useLastUpdate();

  console.log(items);

  return (
    <>
      <Helmet>
        <title>Yours</title>
      </Helmet>
      <PageView page_title={`Feed`} feed_url={feed_url} />
      <TopStickyContainer className="sticky-top pt-2 pb-2 mb-3 bg-light">
        <div className="container-fluid">
          <div className={"row"}>
            <div className={"col text-muted text-center"}>
              <a
                href={items[0]?.from_url}
                target={"_blank"}
                className={"text-decoration-none text-muted"}
                rel={"nofollow external"}
                onClick={() => {
                  custom_event("feed_click", {
                    event_category: "Feed",
                    event_label: items[0]?.from,
                    value: items[0]?.from_url,
                  });
                }}
              >
                <img
                  style={{ display: "inline-block" }}
                  src={items[0]?.favicon}
                  alt=""
                  height={16}
                  className={"mr-1"}
                />{" "}
                <h1 className="h6 d-inline-block">{items[0]?.from}</h1>{" "}
                <i className="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
            {lastUpdate && (
              <div className={"col text-muted text-center"}>
                Last update {lastUpdate}
              </div>
            )}
          </div>
        </div>
      </TopStickyContainer>
      <div className="container-fluid mt-3">
        <PullToRefresh
          pullDownThreshold={80}
          isPullable={!isFetching}
          pullingContent={
            <div style={{ height: 80 }} className={"text-center text-muted"}>
              <p>
                <i className="bi bi-arrow-down-short"></i> Pull to refresh 
                <i className="bi bi-arrow-down-short"></i>
              </p>
            </div>
          }
          refreshingContent={<ActivityIndicator />}
          onRefresh={async () => {
            await dispatch(refreshFeeds() as any);
          }}
        >
          <FeedGrid items={items} id={`feed-${feed_url}-list`} external />
        </PullToRefresh>
      </div>
    </>
  );
};
