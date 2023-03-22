// https://html.spec.whatwg.org/multipage/media.html#mediaevents
export enum MediaEvent {
    ABORT = "abort",
    CAN_PLAY = "canplay",
    CAN_PLAYTHROUGH = "canplaythrough",
    DURATION_CHANGE = "durationchange",
    EMPTIED = "emptied",
    ENDED = "ended",
    ERROR = "error",
    LOADED_DATA = "loadeddata",
    LOADED_METADATA = "loadedmetadata",
    LOAD_START = "loadstart",
    PAUSE = "pause",
    PLAY = "play",
    PLAYING = "playing",
    PROGRESS = "progress",
    RATECHANGE = "ratechange",
    RESIZE = "resize",
    SEEKED = "seeked",
    SEEKING = "seeking",
    STALLED = "stalled",
    SUSPEND = "suspend",
    TIMEUPDATE = "timeupdate",
    VOLUME_CHANGE = "volumechange",
    WAITING = "waiting"
}

export enum NormalizedEvent {
    /** Buffering has ended */
    BUFFERED = "buffered",
    /** Buffering has started */
    BUFFERING = "buffering",
    /** The end of the stream was reached */
    ENDED = "ended",
    /** Loading is complete and playback is ready to start */
    LOADED = "loaded",
    /** The stream was paused */
    PAUSE = "pause",
    /** A request to play was made */
    PLAY = "play",
    /** The stream has started playing after loaded or a paused stream was resumed */
    PLAYING = "playing",
    /** A Seek has ended */
    SEEKED = "seeked",
    /** A Seek has started */
    SEEKING = "seeking",
    /** A time update event */
    TIME_UPDATE = "timeupdate"
}

export type EventCallback = (event: NormalizedEvent) => void