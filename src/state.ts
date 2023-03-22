type PlaybackState = {
    buffering: boolean;
    deferLoadedEvent: boolean;
    deferPlayingEvent: boolean;
    deferSeekedEvent: boolean;
    ended: boolean;
    initialPlayTriggered: boolean;
    loading: boolean;
    paused: boolean;
    playRequested: boolean;
    seeking: boolean;
}

const initialState: PlaybackState = {
    buffering: false,
    deferLoadedEvent: false,
    deferPlayingEvent: false,
    deferSeekedEvent: false,
    ended: false,
    initialPlayTriggered: false,
    loading: true,
    paused: false,
    playRequested: false,
    seeking: false
}