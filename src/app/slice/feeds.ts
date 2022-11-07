import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, {AxiosResponse} from 'axios';

declare const __PROXY__: string;

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
export interface Feed { url: string, title: string, publishedAt: Date, updatedAt?: Date, description?: string, items: FeedItem[] }

interface InitialState {
    feeds: {[url: string]: Feed};
};

const initialState: InitialState = {
    feeds: {},
}

export const verifyAndAddFeed = createAsyncThunk<Feed | null, string>(
    'feeds/verifyAndAddFeed',
    // if you type your function argument here
    async (url) => {
      const response = await axios.get(__PROXY__ + url);
      
      if (!isValidFeed(response)) {
        return null;
      }

      return parseFeed(response.data, url);
    }
  )

export const feedSlice = createSlice({
    name: 'feeds',
    initialState,
    reducers: {
      
    },
    extraReducers(builder) {
        builder.addCase(verifyAndAddFeed.fulfilled, (state, action) => {
            if (action.payload && Object.keys(state.feeds).indexOf(action.payload.url) === -1) {
                state.feeds[action.payload.url] = action.payload;
            }
        })
    },
  });

export const isValidFeed = async (response: AxiosResponse) => {
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

  export const parseFeed: (content: string, url: string) => null | Feed = (content, url) => {
      const parser =  new window.DOMParser().parseFromString(content, 'text/xml');
      switch (parser.firstChild?.nodeName) {
          case "rss": return parseRSSFeed(parser, url);
          case "feed": return parseAtomFeed(parser, url);
          default: return null;
      }
  
  }

  const parseRSSFeed: (parser: Document, uri: string) => Feed = (parser, url) => {
      const items = Array.from(parser.querySelectorAll('item'));
      const feed: Feed = {
          url, 
          title: parser.querySelector('rss > channel > title')?.textContent as string,
          publishedAt: new Date(parser.querySelector('rss > channel > pubDate')?.textContent || ''),
          items: items.map(item => {
            let media: null | FeedItem['media'] = null;
            const mediaNode = Array.from(item.children).find((val) => val.nodeName === 'media:content');
            
            if (mediaNode && typeof mediaNode.getAttribute('url') === "string") {
                media = {
                    url: mediaNode.getAttribute('url') as string, 
                    width: mediaNode.hasAttribute('width') ? Number.parseInt(mediaNode.getAttribute('width') as string) : undefined, 
                    height: mediaNode.hasAttribute('height') ? Number.parseInt(mediaNode.getAttribute('height') as string) : undefined, 
                };
                
                Array.from(mediaNode.children).forEach(mediaSubNode => {
                    switch(mediaSubNode.nodeName) {
                        case 'media:description': media && (media.description = mediaSubNode.textContent || ''); break;
                        case 'media:credit': media && (media.credit = mediaSubNode.textContent || ''); break;
                    }
                });
    
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
      };

      return feed;
  }
  
  const parseAtomFeed: (parser: Document, url: string) => Feed = (parser, url) => {
      const entries = Array.from(parser.querySelectorAll('entry'));

      const feed: Feed = {
        url, 
        title: parser.querySelector('feed > title')?.textContent as string,
        description: parser.querySelector('feed > subtitle')?.textContent as string,
        publishedAt: new Date(parser.querySelector('feed > updated')?.textContent || ''),
        items: entries.map(entry => {
        let media: null | FeedItem['media'] = null;
        const mediaNode = Array.from(entry.children).find((val) => val.nodeName === 'media:content');
        
        if (mediaNode && typeof mediaNode.getAttribute('url') === "string") {
            media = {
                url: mediaNode.getAttribute('url') as string, 
                width: mediaNode.hasAttribute('width') ? Number.parseInt(mediaNode.getAttribute('width') as string) : undefined, 
                height: mediaNode.hasAttribute('height') ? Number.parseInt(mediaNode.getAttribute('height') as string) : undefined, 
            };
            
            Array.from(mediaNode.children).forEach(mediaSubNode => {
                switch(mediaSubNode.nodeName) {
                    case 'media:description': media && (media.description = mediaSubNode.textContent || ''); break;
                    case 'media:credit': media && (media.credit = mediaSubNode.textContent || ''); break;
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
    };
    return feed;
      
  }