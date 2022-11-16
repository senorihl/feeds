import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios, {AxiosResponse} from 'axios';
import {AppDispatch, RootState} from "../store";
import {orderBy, uniqBy, dropRight} from "lodash";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

export interface FeedItem {
    source: string,
    url: string,
    title: string,
    description?: string,
    publishedAt: null | Date,
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
    state: FetchState;
    user?: string;
};

const initialState: InitialState = {
    feeds: {},
    state: FetchState.SUCCESS,
}

export const refreshFeeds = createAsyncThunk<{ [url: string]: Feed }>(
    'feeds/refreshFeeds',
    // if you type your function argument here
    async (_, {getState}) => {
        const ret: { [url: string]: Feed } = {};
        const feeds = Object.values((getState() as RootState).feeds.feeds).reduce((acc, curr) => {
            if (typeof curr.disabled === 'undefined' || !curr.disabled) {
                acc.push(curr.url);
            }
            return acc
        }, [] as string[]);

        const refreshed = await Promise.allSettled(feeds.map(async (url) => {
            const response = await axios.get(__PROXY__ + encodeURIComponent(url), {withCredentials: false});
            return parseFeed(response.data, url);
        }))

        for (const settled of refreshed) {
            if (settled.status === 'fulfilled' && settled.value) {
                ret[settled.value.url] = settled.value;
            }
        }

        return ret;
    }
)

const addFeed = createAsyncThunk<Omit<Feed, 'items'> | null, string>(
    'feeds/addFeed',
    // if you type your function argument here
    async (url) => {
        const response = await axios.get(__PROXY__ + encodeURIComponent(url), {withCredentials: false});

        return parseFeed(response.data, url);
    }
)

export const toggleFeed = createAsyncThunk<boolean, string>(
    'feeds/toggleFeed',
    // if you type your function argument here
    async (url, {getState}) => {
        const state = (getState() as RootState).feeds;
        if (typeof state.feeds[url] !== 'undefined') {
            return !state.feeds[url].disabled;
        }

        throw new Error('not found');
    }
)

export const setUser = createAsyncThunk(
    'feeds/setUser',
    // if you type your function argument here
    async (uid: string | undefined) => {
        let feeds = {} as Awaited<ReturnType<typeof getFeedsFromFirestore>>;
        if (uid) {
            feeds = await getFeedsFromFirestore(uid);
        }

        return {uid, feeds};
    }
)

export const addFeeds = (urls: Array<string>) => async (dispatch: AppDispatch) => {
    await Promise.allSettled(urls.map(url => async () => {
        const response = await axios.get(__PROXY__ + encodeURIComponent(url), {withCredentials: false});

        if (!isValidFeed(response)) {
            return Promise.reject();
        }

        return dispatch(addFeed(url) as any);
    }))

    await dispatch(refreshFeeds() as any);
}

export const verifyAndAddFeed = (url: string) => async (dispatch: AppDispatch) => {
    const response = await axios.get(__PROXY__ + encodeURIComponent(url), {withCredentials: false});

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
    },
    extraReducers(builder) {
        builder
            .addCase(toggleFeed.fulfilled, (state, action) => {
                state.feeds[action.meta.arg].disabled = action.payload;
                state.user && saveFeedsToFirestore(state.user, Object.values(state.feeds).reduce((acc, curr) => {
                    acc[curr.url] = !curr.disabled;
                    return acc;
                }, {} as {[url: string]: boolean}));
            })
            .addCase(setUser.fulfilled, (state, action) => {
                state.user = action.payload.uid;
                if (state.user) {
                    const feeds = Object.values(state.feeds).reduce((acc, curr) => {
                        acc[curr.url] = !curr.disabled;
                        return acc;
                    }, {} as {[url: string]: boolean});
                    state.feeds = {...state.feeds, ...Object.keys(action.payload.feeds).reduce((acc, key) => {
                        acc[key] = {
                            url: key,
                            title: state.feeds[key]?.title || 'from store',
                            publishedAt: state.feeds[key]?.publishedAt || new Date(),
                            items: state.feeds[key]?.items || [],
                            disabled: state.feeds[key]?.disabled
                        }
                        return acc;
                    }, {} as typeof state.feeds)}
                    saveFeedsToFirestore(state.user, {...feeds, ...action.payload.feeds});
                }
            })
            .addCase(refreshFeeds.pending, (state) => {
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
                        state.feeds[url].publishedAt = action.payload[url].publishedAt;
                        state.feeds[url].title = action.payload[url].title;
                        state.feeds[url].description = action.payload[url].description;
                        state.feeds[url].items = orderBy(uniqBy(
                            [...state.feeds[url].items, ...action.payload[url].items],
                            ({ url }) => url
                        ), ({publishedAt}) => publishedAt);
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

export const {} = feedSlice.actions;

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

function parseFeed(content: string, url: string): null | Feed {
    const parser = new window.DOMParser().parseFromString(content, 'text/xml');
    switch (parser.firstChild?.nodeName) {
        case "rss":
            return parseRSSFeed(parser, url);
        case "feed":
            return parseAtomFeed(parser, url);
        default:
            return null;
    }

}

function parseRSSFeed(parser: Document, url: string) : Feed {
    const feed: Omit<Feed, 'items'> = {
        url,
        title: parser.querySelector('rss > channel > title')?.textContent as string,
        publishedAt: new Date(parser.querySelector('rss > channel > pubDate')?.textContent || ''),
    };

    
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

    return feed as Feed;
}

function parseAtomFeed(parser: Document, url: string) : Feed {
    const feed: Omit<Feed, 'items'> = {
        url,
        title: parser.querySelector('feed > title')?.textContent as string,
        description: parser.querySelector('feed > subtitle')?.textContent as string,
        publishedAt: new Date(parser.querySelector('feed > updated')?.textContent || ''),
    };

    
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
    

    return feed as Feed;

}

const getFeedsFromFirestore = async (uid: string) => {
    const store = getFirestore(getApp());
    try {
        const snpsht = await getDoc<{[url: string]: boolean}>(doc(store, uid, 'feeds'));
        if (snpsht.exists()) {
            return snpsht.data();
        }
    } catch (e) {
        console.warn(e)
    }
    return {};
}

const saveFeedsToFirestore = async (uid: string, feeds: {[url: string]: boolean}) => {
    const store = getFirestore(getApp());
    try {
        await setDoc(doc(store, uid, 'feeds'), feeds);
    } catch (e) {
        console.warn(e)
    }
    
}