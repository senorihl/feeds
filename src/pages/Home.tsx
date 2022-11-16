import React from "react";
import { Helmet } from "react-helmet-async";
import {useAppDispatch, useAppSelector, useItems} from "../app/hooks";
import {FeedGrid} from "../features/FeedGrid";
import {FetchState, refreshFeeds} from "../app/slice/feeds";
import styled from 'styled-components'
import {useNow, timeDifference} from "../utils/date";
import {ActivityIndicator} from "../components/ActivityIndicator";
import {PageView} from "../utils/firebase";

const TopStickyContainer = styled.div`
background-color: gray-200;
`

const RefreshButton = styled.a`
background: transparent;
text-transform: uppercase;
text-decoration: none;

&:hover {
    text-decoration: underline;
}
`

const useLastUpdate = () => {
    const now = useNow();
    const lastUpdate = useAppSelector(state => state.feeds.lastUpdate);
    if (!lastUpdate) return null;
    return timeDifference(now, lastUpdate);
}

const AdaptaDiv = styled.div`
transition: all 0.3s ease-out;
height: auto;
`

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const isFetching = useAppSelector(state => state.feeds.state === FetchState.FETCHING)
  const lastUpdate = useLastUpdate();
  const items = useItems();

  return (
    <>
      <Helmet>
        <title>Yours</title>
      </Helmet>
        <PageView page_title={"Home"} />
        <TopStickyContainer className="sticky-top pt-2 pb-2 mb-3 bg-light">
            <div className="container-fluid">
                <div className={"row"}>
                    <div className={`col text-muted ${!lastUpdate ? 'text-center' : 'text-start'}`}>
                        <RefreshButton
                            onClick={() => dispatch(refreshFeeds() as any)}
                            type="button" className={"text-muted"}>
                            Refresh feed <i className="bi bi-arrow-repeat"></i>
                        </RefreshButton>
                    </div>
                    {lastUpdate && <div className={"col text-muted text-end"}>
                        Last update {lastUpdate}
                    </div>}
                </div>
            </div>
        </TopStickyContainer>
        <div className="container-fluid mt-3">
            <AdaptaDiv style={{height: isFetching ? 80 : 0}} className={'text-center'}>
                {isFetching && <ActivityIndicator />}
            </AdaptaDiv>
            <FeedGrid items={items} id={"main-list"} />
        </div>
    </>
  );
};
