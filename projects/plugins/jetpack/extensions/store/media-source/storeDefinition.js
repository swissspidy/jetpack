/**
 * Internal dependencies
 */
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from './constants';

const DEFAULT_STATE = {
	players: {},
	default: null,
};

const actions = {
	registerMediaSource( id, mediaSourceState ) {
		return {
			type: 'REGISTER_MEDIA_SOURCE',
			id,
			mediaSourceState,
		};
	},

	unregisterMediaSource( id ) {
		return {
			type: 'UNREGISTER_MEDIA_SOURCE',
			id,
		};
	},

	setDefaultMediaSource( id ) {
		return {
			type: 'SET_DEFAULT_MEDIA_SOURCE',
			id,
		};
	},

	playMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PLAYING,
		};
	},

	toggleMediaSource( id ) {
		return {
			type: 'TOGGLE_MEDIA_PLAYER_STATE',
			id,
		};
	},

	pauseMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PAUSED,
		};
	},

	errorMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_ERROR,
		};
	},

	setMediaSourceCurrentTime( id, currentTime ) {
		return {
			type: 'SET_MEDIA_PLAYER_CURRENT_TIME',
			id,
			currentTime,
		};
	},
};

actions.updateMediaSourceData = actions.registerMediaSource;

const selectors = {
	getDefaultMediaSource( state ) {
		let playerId = null;
		const keys = Object.keys( state.players );

		if ( state.default ) {
			playerId = state.default;
		} else if ( keys?.length ) {
			playerId = state.players[ keys[ 0 ] ].id;
		}

		if ( ! playerId ) {
			return;
		}

		return state.players[ playerId ];
	},

	getMediaPlayerState( state, id ) {
		const defaultMediaSource = id
			? state.players?.[ id ]
			: selectors.getDefaultMediaSource( state );

		return defaultMediaSource?.state;
	},

	getMediaSourceCurrentTime( state, id ) {
		const defaultMediaSource = id
			? state.players?.[ id ]
			: selectors.getDefaultMediaSource( state );

		return defaultMediaSource?.currentTime;
	},
};

const storeDefinition = {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							id: action.id,
							...action.mediaSourceState,
						},
					},
				};
			}

			case 'UNREGISTER_MEDIA_SOURCE': {
				const currentState = Object.assign( {}, state );
				if ( currentState.players[ action.id ] ) {
					delete currentState.players[ action.id ];
				}

				// Unset default if it's the case.
				if ( action.id === state.default ) {
					currentState.default = null;
				}

				return currentState;
			}

			case 'SET_DEFAULT_MEDIA_SOURCE': {
				return {
					...state,
					default: action.id,
				};
			}

			case 'SET_MEDIA_PLAYER_STATE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							state: action.state,
						},
					},
				};
			}

			case 'TOGGLE_MEDIA_PLAYER_STATE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							state:
								state.players[ action.id ].state === STATE_PLAYING ? STATE_PAUSED : STATE_PLAYING,
						},
					},
				};
			}

			case 'SET_MEDIA_PLAYER_CURRENT_TIME': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							currentTime: action.currentTime,
						},
					},
				};
			}
		}

		return state;
	},

	actions,

	selectors,
};
export default storeDefinition;
