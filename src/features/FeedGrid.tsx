import React from "react";
import {Feed, FeedItem} from "../app/slice/feeds";
import Masonry from "masonry-layout";
import {timeDifference, useNow} from "../utils/date";

export interface EnrichedFeedItem extends FeedItem {
    from: Feed["title"];
    favicon: string;
    from_url: string;
}

export const FeedGrid: React.FC<{items: EnrichedFeedItem[], id: string}> = ({items, id}) => {
    const elem = React.createRef<HTMLDivElement>();
    const msnry = React.useRef<Masonry>();
    const now = useNow();

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
                                <h5 className="card-title" dangerouslySetInnerHTML={{__html: item.title}}></h5>
                                {item.description && <p className="card-text" dangerouslySetInnerHTML={{__html: item.description}}></p>}
                                <p><small className="text-muted">Published {timeDifference(now, item.publishedAt.getTime())}</small></p>
                                <p><small className="text-muted"><a href={item.url} target={'_blank'} className="text-muted stretched-link">Read this article <i className="bi bi-box-arrow-up-right"></i></a></small></p>
                            </div>
                            <div className="card-footer">
                                <a href={item.from_url} target={"_blank"} rel={"nofollow external"}>
                                    <small className="text-muted">
                                        <img style={{display: 'inline-block'}} src={item.favicon} alt="" height={16} className={'mr-1'} /> {item.from} <i className="bi bi-box-arrow-up-right"></i>
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
