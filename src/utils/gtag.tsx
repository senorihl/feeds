import React, {PropsWithChildren} from "react";
import ControlParams = Gtag.ControlParams;
import EventParams = Gtag.EventParams;
import CustomParams = Gtag.CustomParams;

export function useGoogleAnalytics() {
    const event = (event_name: string, event_params?: object) => {
        __DEV__ && console.log('event', event_name, event_params)
        window.gtag('event', event_name, event_params);
    }

    const page_view = (params: ControlParams | EventParams | CustomParams) => {
        event('page_view', params);
    };

    const custom_event = (custom_event: string, params?: object) => {
        event(custom_event, params);
    };

    return {page_view, custom_event};
}

export const PageView: React.FC<PropsWithChildren<ControlParams | EventParams | CustomParams>> = ({children, ...props}) => {
    const { page_view } = useGoogleAnalytics();

    React.useEffect(() => {
        page_view(props);
    }, [])

    return <React.Fragment>{children}</React.Fragment>
}
