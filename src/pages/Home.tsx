import React from "react";
import { Helmet } from "react-helmet-async";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { FeedItem, Feed, verifyAndAddFeed } from "../app/slice/feeds";
import { orderBy } from "lodash";

let p: null | Promise<void | any[]> = null;

interface EnrichedFeedItem extends FeedItem {
  from: Feed["title"];
}

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) =>
    orderBy(
      Object.values(state.feeds.feeds).reduce((acc, curr) => {
        acc.push(
          ...curr.items.map((item) => ({
            ...item,
            from: state.feeds.feeds[item.source].title,
          }))
        );
        return acc;
      }, [] as EnrichedFeedItem[]),
      ({ publishedAt }) => publishedAt,
      "desc"
    )
  );

  React.useEffect(() => {
    if (!p) {
      p = Promise.allSettled([
        dispatch(verifyAndAddFeed("https://www.lemonde.fr/rss/une.xml") as any),
        dispatch(
          verifyAndAddFeed(
            "https://storage.googleapis.com/lobs-159411.appspot.com/phalcon/feeds/atom/prod/public_feed.xml"
          ) as any
        ),
      ]).then(() => {
        p = null;
      });
    }
  }, []);

  return (
    <div className="container-fluid">
      <Helmet>
        <title>Welcome</title>
      </Helmet>
      <ul>
        {items.map((item) => (
          <li key={item.url}>
            <>
              {item.publishedAt} | {item.from} | {item.title}
            </>
          </li>
        ))}
      </ul>
    </div>
  );
};
