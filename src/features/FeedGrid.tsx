import React from "react";
import {Feed, FeedItem} from "../app/slice/feeds";
import Masonry from "masonry-layout";
import {timeDifference, useNow} from "../utils/date";
import {useFirebaseApp} from "../utils/firebase";

export interface EnrichedFeedItem extends FeedItem {
    from: Feed["title"];
    favicon: string;
    from_url: string;
}

export const FeedGrid: React.FC<{items: EnrichedFeedItem[], id: string}> = ({items, id}) => {
    const elem = React.createRef<HTMLDivElement>();
    const msnry = React.useRef<Masonry>();
    const now = useNow();
    const {custom_event} = useFirebaseApp();

    React.useEffect(() => {
        if (elem.current) {
            msnry.current = new Masonry(elem.current, {percentPosition: true});
        }
        setTimeout(() => {
            // @ts-ignore
            msnry.current?.layout();
        }, 500)
    }, [items, elem]);

    return (
        <div className={"row"} id={id} ref={elem}>
            {items.map((item) => {

                return (
                    <div className={"col-sm-6 col-lg-4 mb-4"} key={`${item.source}-${item.url}`}>
                        <div className="card">
                            {item.media?.url &&
                               (
                                   <a
                                       href={item.url}
                                       target={'_blank'}
                                       rel={'nofollow external'}
                                       onClick={(event) => {
                                           custom_event('feed_item_click', {
                                               'event_category': item.from,
                                               'event_label': item.title,
                                               'value': item.url,
                                           });
                                       }}>
                                   <img src={item.media.url} className="card-img-top" alt={[item.media.description, item.media.credit].filter(e => !!e?.trim()).join(' // ')} />
                                   </a>)
                            }
                            <div className="card-body">
                                <a
                                    className={"text-reset text-decoration-none"}
                                    href={item.url}
                                    target={'_blank'}
                                    rel={'nofollow external'}
                                    onClick={(event) => {
                                        custom_event('feed_item_click', {
                                            'event_category': item.from,
                                            'event_label': item.title,
                                            'value': item.url,
                                        });
                                    }}>
                                    <h5 className="card-title" dangerouslySetInnerHTML={{__html: item.title}} />
                                    {item.description && <p className="card-text" dangerouslySetInnerHTML={{__html: item.description}}></p>}
                                    {!!item.publishedAt && <p className={'mb-0'}><small className="text-muted">Published {timeDifference(now, item.publishedAt.getTime())}</small></p>}
                                </a>
                            </div>
                            <div className="card-footer">
                                <a
                                    href={item.from_url}
                                    target={"_blank"}
                                    className={'text-decoration-none text-muted'}
                                    rel={"nofollow external"}
                                    onClick={() => {
                                        custom_event('feed_click', {
                                            'event_category': 'Feed',
                                            'event_label': item.from,
                                            'value': item.from_url,
                                        });
                                    }}><img style={{display: 'inline-block'}} src={item.favicon} alt="" height={16} className={'mr-1'} /> {item.from} <i className="bi bi-box-arrow-up-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
