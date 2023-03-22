import { MediaEvent, NormalizedEvent, EventCallback } from './events'
import { PlaybackState, initialState } from './state'

export type VideoPlaybackOptions = {
    callback: EventCallback;
    element: HTMLVideoElement;
}

type Noop = () => void

export function getNormalizedPlayback({
    callback,
    element
}: VideoPlaybackOptions) {
    let ratechangeTimeout: number | undefined
    let state: PlaybackState = { ...initialState }

    function shouldTriggerRatechangeBuffer() {
        return !state.seeking && !state.buffering && element.playbackRate === 0 && !element.seeking
    }

    function isNotReady() {
        return state.loading || state.ended
    }

    function onCanPlayThrough() {
        if (state.loading) {
            // Some implementations set playbackRate to 0 when buffering needs to happen
            // defer the load event and recover when the rate changes
            if (element.playbackRate === 0) {
                state = { ...state, deferLoadedEvent: true }
            } else {
                state = { ...state, deferLoadedEvent: false, loading: false }
                callback(NormalizedEvent.LOADED)
            }
        }
    }

    function onEnded() {
        state = {
            ...state,
            buffering: false,
            ended: true,
            loading: false,
            paused: true,
            seeking: false
        }

        clearTimeout(ratechangeTimeout)
        callback(NormalizedEvent.ENDED)
    }


    function onPlay() {
        if (isNotReady()) return
        if (!state.paused || !state.initialPlayTriggered) return
        
        state = { ...state, playRequested: true }
        callback(NormalizedEvent.PLAY)
    }

    function onPlaying() {
        clearTimeout(ratechangeTimeout)

        const stateUpdates: Partial<PlaybackState> = { deferPlayingEvent: true }

        if (!state.initialPlayTriggered) {
            stateUpdates.initialPlayTriggered = true
            stateUpdates.paused = false
            stateUpdates.playRequested = false

            callback(NormalizedEvent.PLAYING)
        } else if (state.buffering) {
            stateUpdates.buffering = false
            callback(NormalizedEvent.BUFFERED)
        } else if (state.seeking) {
            stateUpdates.seeking = false
            stateUpdates.deferSeekedEvent = false
            callback(NormalizedEvent.SEEKED)
        }

        if (state.paused && state.playRequested) {
            stateUpdates.paused = false
            stateUpdates.playRequested = false

            callback(NormalizedEvent.PLAYING)
        }

        state = { ...state, ...stateUpdates }
    }

    function onPause() {
        if (!state.playRequested && state.paused) return

        const stateUpdates: Partial<PlaybackState> = { playRequested: false }

        if (state.deferLoadedEvent) {
            stateUpdates.loading = false
            stateUpdates.deferLoadedEvent = false

            callback(NormalizedEvent.LOADED)

            if (element.paused) {
                stateUpdates.paused = true
                callback(NormalizedEvent.PAUSE)
            }
        } else {
            stateUpdates.paused = true
            callback(NormalizedEvent.PAUSE)
        }

        state = { ...state, ...stateUpdates }
    }

    function onRatechange() {
        clearTimeout(ratechangeTimeout)

        const hasPositivePlaybackRate = element.playbackRate > 0
        if (state.deferLoadedEvent && hasPositivePlaybackRate) {
            onCanPlayThrough()
        }

        if (state.deferSeekedEvent && hasPositivePlaybackRate) {
            onSeeked()
        }

        if (state.deferPlayingEvent && hasPositivePlaybackRate) {
            onPlaying()
        }

        if (isNotReady()) return

        if (shouldTriggerRatechangeBuffer()) {
            ratechangeTimeout = window.setTimeout(() => {
                if (shouldTriggerRatechangeBuffer()) {
                    onWaiting()
                }
            }, 50)
        } else if (state.buffering && hasPositivePlaybackRate) {
            state = { ...state, buffering: false }
            callback(NormalizedEvent.BUFFERED)
        }
    }

    function onSeeked() {
        if (isNotReady()) return

        // If we weren't previously seeking then we shouldn't be able to end that seek.
        // While this seems like an obvious guard clause to ensure no illogical states
        // this is possible to reach when the rate changes during a seek.
        // seeking (not ready) -> loaded (ready) -> seeked
        if (!state.seeking) return

        if (element.playbackRate === 0) {
            state = { ...state, deferSeekedEvent: true }
            return
        }

        state = { ...state, deferSeekedEvent: false, seeking: false }
        callback(NormalizedEvent.SEEKED)
    }

    function onSeeking() {
        if (isNotReady()) return

        // end any ongoing buffering to allow for accurate reporting of the buffer duration
        // before starting the seek
        if (state.buffering) {
            callback(NormalizedEvent.BUFFERED)
        }

        state = { ...state, buffering: false, seeking: true }
        callback(NormalizedEvent.SEEKING)
    }

    function onTimeupdate() {
        if (isNotReady()) return
        if (state.buffering && !element.paused) {
            state = { ...state, buffering: false }
            callback(NormalizedEvent.BUFFERED)
        }

        callback(NormalizedEvent.TIME_UPDATE)
    }

    function onWaiting() {
        clearTimeout(ratechangeTimeout)

        if (isNotReady()) return
        // Ignoring any waiting while seeking
        if (state.seeking) return

        // [MediaEvent.SEEKING] isn't always guarenteed to be sent before [MediaEvent.WAITING] in all browsers
        if (element.seeking) {
            onSeeking()
            return
        }

        if (state.buffering) return

        state = { ...state, buffering: true }
        callback(NormalizedEvent.BUFFERING)
    }

    const EventHandlerTuples: Array<[MediaEvent, Noop]> = [
        [MediaEvent.CAN_PLAYTHROUGH, onCanPlayThrough],
        [MediaEvent.ENDED, onEnded],
        [MediaEvent.PAUSE, onPause],
        [MediaEvent.PLAY, onPlay],
        [MediaEvent.PLAYING, onPlaying],
        [MediaEvent.RATECHANGE, onRatechange],
        [MediaEvent.SEEKED, onSeeked],
        [MediaEvent.SEEKING, onSeeking],
        [MediaEvent.TIMEUPDATE, onTimeupdate],
        [MediaEvent.WAITING, onWaiting]
    ]

    function subscribe() {
        EventHandlerTuples.forEach(([event, handler]) => {
            element.addEventListener(event, handler)
        })
    }

    function unsubscribe() {
        clearTimeout(ratechangeTimeout)
        EventHandlerTuples.forEach(([event, handler]) => {
            element.removeEventListener(event, handler)
        })
    } 

    return { subscribe, unsubscribe }
}
