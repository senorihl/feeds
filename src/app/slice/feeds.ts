import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface StoredFeed { url: string, priority: number };
interface StoredElement {title: string, image: string, description: string, authors: Array<string>, source: string};

interface InitialState {
    feeds: Array<StoredFeed>;
    elements: Array<StoredElement>
};

const initialState: InitialState = {
    feeds: [],
    elements: [],
}

export const verifyAndAddFeed = createAsyncThunk<StoredFeed | null, string>(
    'feeds/verifyAndAddFeed',
    // if you type your function argument here
    async (url) => {
      const response = await fetch(url);
      console.log(await response.text())
      return null;
    }
  )

export const feedSlice = createSlice({
    name: 'feeds',
    initialState,
    reducers: {
      
    },
    extraReducers(builder) {
        builder.addCase(verifyAndAddFeed.fulfilled, (state, action) => {
            if (action.payload && state.feeds.map(({url}) => url).indexOf(action.payload.url) === -1) {
                state.feeds.push(action.payload);
            }
        })
    },
  })