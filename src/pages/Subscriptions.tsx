import React from "react";
import { Helmet } from "react-helmet-async";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  cleanFeeds,
  isValidFeed,
  toggleFeed,
  verifyAndAddFeed,
} from "../app/slice/feeds";
import { TimeoutId } from "@reduxjs/toolkit/dist/query/core/buildMiddleware/types";
import axios from "axios";
import { PageView, useFirebaseApp, useUser } from "../utils/firebase";
import { signOut } from "firebase/auth";

enum FEED_VALIDITY {
  NONE,
  FETCHING,
  INVALID,
  VALID,
  ADDING,
}

export const Subscriptions: React.FC = () => {
  const user = useUser();
  const { auth } = useFirebaseApp();
  const capping = React.useRef<TimeoutId | null>(null);
  const [disableSignOut, setSignOutDisabled] = React.useState(false);
  const dispatch = useAppDispatch();
  const { custom_event } = useFirebaseApp();
  const sources = useAppSelector((state) => state.feeds.feeds);
  const itemCount = useAppSelector((state) =>
    Object.values(state.feeds.feeds).reduce(
      (acc, feed) => acc + feed.items.length,
      0
    )
  );
  const [nextFeed, setNextFeed] = React.useState(
    process.env.NODE_ENV !== "production"
      ? "https://www.lexpress.fr/rss/alaune.xml"
      : ""
  );
  const [isValid, setIsValid] = React.useState<FEED_VALIDITY>(
    FEED_VALIDITY.NONE
  );

  React.useEffect(() => {
    if (null !== capping.current) {
      clearTimeout(capping.current);
    }

    capping.current = setTimeout(async () => {
      if (nextFeed) {
        setIsValid(FEED_VALIDITY.FETCHING);
        try {
          const response = await axios.get(
            __PROXY__ + encodeURIComponent(nextFeed),
            { withCredentials: false }
          );
          setIsValid(
            isValidFeed(response) ? FEED_VALIDITY.VALID : FEED_VALIDITY.INVALID
          );
        } catch (e) {
          setIsValid(FEED_VALIDITY.INVALID);
        }
      } else {
        setIsValid(FEED_VALIDITY.NONE);
      }
    }, 200);
  }, [nextFeed]);

  return (
    <div className="container-fluid mt-3">
      <Helmet>
        <title>Subscriptions</title>
      </Helmet>
      <PageView page_title={"Subscriptions"} />
      {Object.keys(sources).map((key) => {
        const source = sources[key];
        return (
          <div className="form-check form-switch" key={`div-toggle-${key}`}>
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={
                typeof source.disabled === "undefined" || !source.disabled
              }
              onChange={() => dispatch(toggleFeed(key) as any)}
              id={`${source.url}-toggle`}
            />
            <label
              className="form-check-label"
              htmlFor={`${source.url}-toggle`}
            >
              {source.title}{" "}
              <small className={"text-muted"}>{source.url}</small>
            </label>
          </div>
        );
      })}
      <div className="row g-3 align-items-center mt-3">
        <div className="col-auto">
          <label htmlFor="add-source" className="col-form-label">
            Add a source from URL
          </label>
        </div>
        <div className="col-auto">
          <input
            type="url"
            id="add-source"
            className={`form-control ${
              isValid === FEED_VALIDITY.VALID
                ? "is-valid"
                : isValid === FEED_VALIDITY.INVALID
                ? "is-invalid"
                : ""
            }`}
            aria-describedby="add-source-helper"
            onChange={(event) => setNextFeed(event.target.value)}
            value={nextFeed}
          />
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-primary"
            disabled={isValid !== FEED_VALIDITY.VALID}
            onClick={async () => {
              setIsValid(FEED_VALIDITY.ADDING);
              try {
                await dispatch(verifyAndAddFeed(nextFeed) as any);
                custom_event("feed_add", {
                  event_category: "Feed",
                  event_label: "Add",
                  value: nextFeed,
                });
              } finally {
                setIsValid(FEED_VALIDITY.NONE);
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-warning"
            onClick={async () => {
              setIsValid(FEED_VALIDITY.ADDING);
              try {
                await dispatch(cleanFeeds() as any);
              } finally {
                setIsValid(FEED_VALIDITY.NONE);
              }
            }}
          >
            Clean feed ({itemCount})
          </button>
        </div>
      </div>
      {user?.email && (
        <div className="row g-3 align-items-center mt-3">
          <div className="col-auto">Currently logged in as {user.email}</div>
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-warning"
              disabled={disableSignOut}
              onClick={() => {
                setSignOutDisabled(true);
                signOut(auth).finally(() => setSignOutDisabled(false));
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
