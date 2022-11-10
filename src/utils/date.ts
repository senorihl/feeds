import React from "react";

export function useNow() {
    const [now, setNow] = React.useState(Date.now());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            clearInterval(interval);
        }
    });

    return now;
}

export function timeDifference(current: number, previous: number) {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const elapsed = current - previous;

    if (elapsed < 5 * 1000) {
        return 'just now'
    }

    if (elapsed < 30 * 1000) {
        return 'a few seconds ago'
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
