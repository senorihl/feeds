import React from "react";
import {Feed, FeedItem} from "../app/slice/feeds";
import Masonry from "masonry-layout";

export interface EnrichedFeedItem extends FeedItem {
    from: Feed["title"];
    favicon: string;
    from_url: string;
}

function timeDifference(current: number, previous: number) {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const elapsed = current - previous;

    if (elapsed < msPerMinute) {
        const plural = Math.round(elapsed/1000) === 1 ? '' : 's';
        return Math.round(elapsed/1000) + ' second' + plural + ' ago';
    }

    else if (elapsed < msPerHour) {
        const plural = Math.round(elapsed/msPerMinute) === 1 ? '' : 's';
        return Math.round(elapsed/msPerMinute) + ' minute' + plural + '  ago';
    }

    else if (elapsed < msPerDay ) {
        const plural = Math.round(elapsed/msPerHour) === 1 ? '' : 's';
        return Math.round(elapsed/msPerHour ) + ' hour' + plural + '  ago';
    }

    else if (elapsed < msPerMonth) {
        const plural = Math.round(elapsed/msPerDay) === 1 ? '' : 's';
        return Math.round(elapsed/msPerDay) + ' day' + plural + '  ago';
    }

    else {
        const date = new Date();
        date.setTime(previous)
        return 'on ' + date.toLocaleDateString();
    }
}

export const FeedGrid: React.FC<{items: EnrichedFeedItem[], id: string}> = ({items, id}) => {
    const elem = React.createRef<HTMLDivElement>();
    const msnry = React.useRef<Masonry>();

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
                            {item.media?.url && <img src={item.media.url} className="card-img-top" alt={[item.media.description, item.media.credit].filter(e => !!e?.trim()).join(' // ')} />}
                            <div className="card-body">
                                <h5 className="card-title">{item.title}</h5>
                                {item.description && <p className="card-text">{item.description}</p>}
                                <small className="text-muted">Published {timeDifference(Date.now(), item.publishedAt.getTime())}</small>
                                {/*<a href="#" className="btn btn-primary">Go somewhere</a>*/}
                            </div>
                            <div className="card-footer">
                                <a href={item.from_url} target={"_blank"} rel={"nofollow external"}>
                                    <small className="text-muted">
                                        <img src={item.favicon} alt="" height={16} className={'mr-1'} /> {item.from} <i className="bi bi-box-arrow-up-right"></i>
                                    </small>
                                </a>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}