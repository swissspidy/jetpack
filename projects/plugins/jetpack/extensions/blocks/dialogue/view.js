/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { select, dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import './style.scss';
import './view.scss';

const STORE_ID = 'jetpack/media-source';

domReady( function () {
	let prevPlayingButton;
	// Play podcast by cliking on the timestamp label
	document.body.addEventListener( 'click', event => {
		if ( ! event?.target?.classList?.contains( 'wp-block-jetpack-dialogue__timestamp-play-button' ) ) {
			return;
		}

		const el = event.target;

		const timestamp = el?.dataset?.timestamp;
		if ( ! timestamp ) {
			return;
		}
		const mediaSource = select( STORE_ID )?.getDefaultMediaSource();
		if ( ! mediaSource ) {
			return;
		}

		event.preventDefault();
		const {
			setMediaSourceCurrentTime,
			playMediaSource,
			pauseMediaSource,
		} = dispatch( STORE_ID );

		playMediaSource( mediaSource.id, timestamp );
		if ( el.classList.contains( 'is-paused' ) ) {
			el.classList.remove( 'is-paused' );
			pauseMediaSource( mediaSource.id, timestamp );
		} else {
			if ( prevPlayingButton ) {
				prevPlayingButton.classList.remove( 'is-paused' );
			}
			prevPlayingButton = el;

			el.classList.add( 'is-paused' );
			setMediaSourceCurrentTime( mediaSource.id, timestamp );
			playMediaSource( mediaSource.id, timestamp );
		}
	} );
} );