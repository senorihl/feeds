import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import {orderBy, uniqBy, dropRight} from "lodash";
import {EnrichedFeedItem} from "../features/FeedGrid";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useItems = (filter_source: string | null = null, sort_order: "asc" | "desc" = "desc") => {
    return  useAppSelector((state) =>
            orderBy(
                uniqBy(
                Object.values(state.feeds.feeds).reduce((acc, curr) => {
                    typeof curr.items === 'object' && acc.push(
                        ...curr.items.map((item) => {
                            const favicon = new URL(item.url);
                            favicon.pathname = '/favicon.ico';
                            const from_url = new URL(item.url);
                            from_url.pathname = '/';
                            return  {
                                ...item,
                                favicon: favicon.toString(),
                                from_url: from_url.toString(),
                                publishedAt: typeof item.publishedAt === "string" ? new Date(item.publishedAt) : item.publishedAt,
                                from: state.feeds.feeds[item.source].title,
                            }
                        }).filter(({source}) => {
                            if (filter_source) {
                                return filter_source === source;
                            } else {
                                return typeof state.feeds.feeds[source].disabled === "undefined" || !state.feeds.feeds[source].disabled
                            }
                        })
                    );
                    return acc;
                }, [] as EnrichedFeedItem[]),
            ({ source, url }) => `${url}`,
        ),
                ({ publishedAt }) => publishedAt,
        sort_order
),
    );
}
