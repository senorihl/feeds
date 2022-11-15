import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios, {AxiosResponse} from 'axios';
import {AppDispatch, RootState} from "../store";
import {orderBy, uniqBy, dropRight} from "lodash";

export interface FeedItem {
    source: string,
    url: string,
    title: string,
    description?: string,
    publishedAt: Date,
    updatedAt?: Date,
    media?: {
        url: string,
        width?: number,
        height?: number,
        description?: string,
        credit?: string,
    }

};

export interface Feed {
    url: string,
    title: string,
    publishedAt: Date,
    updatedAt?: Date,
    description?: string,
    items: FeedItem[],
    disabled?: boolean
}

export enum FetchState {
    FETCHING,
    SUCCESS,
    ERRORED
}

interface InitialState {
    feeds: { [url: string]: Feed };
    lastUpdate?: number;
    state: FetchState
};

const initialState: InitialState = {
    feeds: {},
    state: FetchState.SUCCESS
}

export const refreshFeeds = createAsyncThunk<{ [url: string]: Pick<Feed, 'items'> }>(
    'feeds/refreshFeeds',
    // if you type your function argument here
    async (_, {getState}) => {
        const ret: { [url: string]: Pick<Feed, 'items'> } = {};
        const feeds = Object.keys((getState() as RootState).feeds.feeds);

        const refreshed = await Promise.allSettled(feeds.map(async (url) => {
            const response = await axios.get(__PROXY__ + url);
            return parseFeed(response.data, url);
        }))

        for (const settled of refreshed) {
            if (settled.status === 'fulfilled' && settled.value) {
                ret[settled.value.url] = {items: settled.value.items};
            }
        }

        return ret;
    }
)

const addFeed = createAsyncThunk<Omit<Feed, 'items'> | null, string>(
    'feeds/addFeed',
    // if you type your function argument here
    async (url) => {
        const response = await axios.get(__PROXY__ + url);

        return parseFeed(response.data, url, true);
    }
)

export const verifyAndAddFeed = (url: string) => async (dispatch: AppDispatch) => {
    const response = await axios.get(__PROXY__ + url);

    if (!isValidFeed(response)) {
        return null;
    }

    await dispatch(addFeed(url) as any);
    await dispatch(refreshFeeds() as any);
}

export const feedSlice = createSlice({
    name: 'feeds',
    initialState,
    reducers: {
        toggleFeed(state, action: PayloadAction<string>) {
            if (typeof state.feeds[action.payload] !== 'undefined') {
                state.feeds[action.payload].disabled = !state.feeds[action.payload].disabled;
            }
        },
        cleanFeeds(state) {
            Object.keys(state.feeds).forEach(key => {
                state.feeds[key].items = [];
            })
        },
        mergeFeeds(state, action: PayloadAction<InitialState['feeds'] & {lastUpdate: number}>) {
            Object.keys(state.feeds).forEach(key => {
                if (key !== 'lastUpdate' && typeof action.payload[key] !== 'undefined') {
                    state.feeds[key].items = uniqBy(
                        [...state.feeds[key].items, ...action.payload[key].items],
                        ({ url }) => url
                    );
                }
            });

            Object.keys(action.payload).forEach(key => {
                if (key !== 'lastUpdate' && typeof state.feeds[key] === 'undefined') {
                    state.feeds[key] = action.payload[key];
                }
            });

            delete state.feeds['lastUpdate'];
        }
    },
    extraReducers(builder) {
        builder
            .addCase(refreshFeeds.pending, (state, ...rest) => {
                state.state = FetchState.FETCHING;
            })
            .addCase(refreshFeeds.rejected, (state) => {
                state.state = FetchState.ERRORED;
            })
            .addCase(addFeed.fulfilled, (state, action) => {
                if (action.payload && Object.keys(state.feeds).indexOf(action.payload.url) === -1) {
                    state.feeds[action.payload.url] = {...action.payload, items: []};
                }
            })
            .addCase(refreshFeeds.fulfilled, (state, action) => {
                for (const url in action.payload) {
                    if (action.payload && Object.keys(state.feeds).indexOf(url) > -1) {
                        state.feeds[url].items = dropRight(orderBy(uniqBy(
                            [...state.feeds[url].items, ...action.payload[url].items],
                            ({ url }) => url
                        ), ({publishedAt}) => publishedAt),
                            20
                        );
                    }
                }
                state.lastUpdate = Date.now();
                state.state = FetchState.SUCCESS;
            })
    },
});

export const cleanFeeds = () => async (dispatch: AppDispatch) => {
    await dispatch(feedSlice.actions.cleanFeeds() as any);
    await dispatch(refreshFeeds() as any);
}

export const {toggleFeed, mergeFeeds} = feedSlice.actions;

export const isValidFeed = (response: AxiosResponse) => {
    if (response.status !== 200) {
        return false;
    }

    if (!response.headers["content-type"]) {
        return false;
    }

    return [
        "text/xml",
        "application/rss+xml",
        "application/atom+xml",
        "application/xml",
    ].some((valid) =>
        (response.headers["content-type"] as string).includes(valid)
    );
}

function parseFeed<T extends boolean = false>(content: string, url: string, noItem?: T): null | (T extends true ? Omit<Feed, 'item'> : Feed) {
    const parser = new window.DOMParser().parseFromString(content, 'text/xml');
    switch (parser.firstChild?.nodeName) {
        case "rss":
            return parseRSSFeed(parser, url, noItem);
        case "feed":
            return parseAtomFeed(parser, url, noItem);
        default:
            return null;
    }

}

function parseRSSFeed<T extends boolean = false>(parser: Document, url: string, noItem?: T): T extends true ? Omit<Feed, 'item'> : Feed {
    const feed: Omit<Feed, 'items'> = {
        url,
        title: parser.querySelector('rss > channel > title')?.textContent as string,
        publishedAt: new Date(parser.querySelector('rss > channel > pubDate')?.textContent || ''),
    };

    if (!noItem) {
        const items = Array.from(parser.querySelectorAll('item'));
        (feed as Feed).items = items.map(item => {
            let media: null | FeedItem['media'] = null;
            const mediaNode = Array.from(item.children).find((val) => val.nodeName === 'media:content');

            if (mediaNode && typeof mediaNode.getAttribute('url') === "string") {
                media = {
                    url: mediaNode.getAttribute('url') as string,
                    width: mediaNode.hasAttribute('width') ? Number.parseInt(mediaNode.getAttribute('width') as string) : undefined,
                    height: mediaNode.hasAttribute('height') ? Number.parseInt(mediaNode.getAttribute('height') as string) : undefined,
                };

                Array.from(mediaNode.children).forEach(mediaSubNode => {
                    switch (mediaSubNode.nodeName) {
                        case 'media:description':
                            media && (media.description = mediaSubNode.textContent || '');
                            break;
                        case 'media:credit':
                            media && (media.credit = mediaSubNode.textContent || '');
                            break;
                    }
                });
            }

            if (!media) {
                const enclosure = Array.from(item.children).find((val) => val.nodeName === 'enclosure');
                if (enclosure && typeof enclosure.getAttribute('url') === "string") {
                    media = {url: enclosure.getAttribute('url') as string};
                }
            }

            return {
                source: url,
                url: item.querySelector("link")?.textContent as string,
                title: item.querySelector("title")?.textContent as string,
                description: item.querySelector("description")?.textContent as string,
                media: media || undefined,
                publishedAt: new Date(item.querySelector("pubDate")?.textContent || ''),
            };
        })
    }

    return feed as T extends true ? Omit<Feed, 'item'> : Feed;
}

function parseAtomFeed<T extends boolean = false>(parser: Document, url: string, noItem?: T): T extends true ? Omit<Feed, 'item'> : Feed {
    const feed: Omit<Feed, 'items'> = {
        url,
        title: parser.querySelector('feed > title')?.textContent as string,
        description: parser.querySelector('feed > subtitle')?.textContent as string,
        publishedAt: new Date(parser.querySelector('feed > updated')?.textContent || ''),
    };

    if (!noItem) {
        const entries = Array.from(parser.querySelectorAll('entry'));
        (feed as Feed).items = entries.map(entry => {
            let media: null | FeedItem['media'] = null;
            const mediaNode = Array.from(entry.children).find((val) => val.nodeName === 'media:content');

            if (mediaNode && typeof mediaNode.getAttribute('url') === "string") {
                media = {
                    url: mediaNode.getAttribute('url') as string,
                    width: mediaNode.hasAttribute('width') ? Number.parseInt(mediaNode.getAttribute('width') as string) : undefined,
                    height: mediaNode.hasAttribute('height') ? Number.parseInt(mediaNode.getAttribute('height') as string) : undefined,
                };

                Array.from(mediaNode.children).forEach(mediaSubNode => {
                    switch (mediaSubNode.nodeName) {
                        case 'media:description':
                            media && (media.description = mediaSubNode.textContent || '');
                            break;
                        case 'media:credit':
                            media && (media.credit = mediaSubNode.textContent || '');
                            break;
                    }
                });
            }

            return {
                source: url,
                url: entry.querySelector("link")?.getAttribute('href') as string,
                title: entry.querySelector("title")?.textContent as string,
                description: entry.querySelector("summary")?.textContent as string | undefined,
                media: media || undefined,
                publishedAt: new Date(entry.querySelector("published")?.textContent || ''),
                updatedAt: new Date(entry.querySelector("updated")?.textContent || ''),
            };
        })
    }

    return feed as T extends true ? Omit<Feed, 'item'> : Feed;

}
