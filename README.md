VOLAR EMBED CONTROLLER
======================

This project is dedicated to providing clients with the ability to communicate with the volar iframe embeds.  This enables them to do things like pause and play (as well as seek and recieve metadata events) through javascript.

Why?
----
Because the Volar player is enclosed in an iframe, this prevents people that embed the iframe on their pages from interacting with the player due to cross-domain limitations of modern browsers.  However, modern browsers also enable developers to use something called `postMessage` (in most browsers, this is achieved with a [`MessageChannel` object](http://msdn.microsoft.com/en-us/library/windows/apps/hh441303.aspx), although some browsers like firefox need to be handled differently, so there is a fallback.).  By hooking in event callbacks on the embed-side, we can allow users of the embed to programmatically control the player themselves.

Example Code
------------
```html
<style type="text/css">
	#debug-progress-container {
		width:640px;
		background: #ccc;
		height: 20px;
	}
	#debug-progress {
		width:0;
		background: #000;
		height:20px;
	}
</style>
<iframe src="http://local.platypus.com/default/broadcast/embed/70-mybroadcast?w=640" frameborder="0" width="640" height="360" id="frame" scrolling="no"></iframe>
<div id="debug-progress-container">
	<div id="debug-progress"></div>
</div>
<div id="debug-info"></div>
```

With the above iframe (as well as including `Volarvideo.js` in my page), we can then do this:

```js
var i = document.getElementById('frame'),
	debugdiv = document.getElementById('debug-info')
	debugprogress = document.getElementById('debug-progress'),
	v = new Volarvideo;
v.on('error', function(err){
	try {
		console.error("Error when attempting to connect to iframe:", err);
	} catch(ex) {
		//do something else if console.error fails
	} 
}
});
v.on('connected', function(){
	//perhaps setup something on the page, or initiate other related things that require a connection
	//....
});
v.on('onCurrentTimeChange', function(data) {
	var percent;
	debugdiv.innerHTML = "Current State: " + data.state + ", Total duration of video: " + data.duration + ", current position: " + data.position;
	percent = (data.position / data.duration) * 100;
	debugprogress.style.width = percent + '%';
});
v.connect(i);
v.play();	//this will occur when the connection completes if the connection doesn't complete by the time this is run, as it is queued
```

Once the `v.connect()` call has completed, the v.on('event name') callback(s) will be bound and executed as events occur.  Additionally, since postMessage can sometimes be delayed (usually by a few milliseconds), calls like `v.play()`, `v.pause()`, and `v.seek(pos)` are enqueued and called once the connection is established so that they aren't lost.  In the example above, the connection is established, a listener for 'onCurrentTimeChange' is bound, and the player is instructed to play immediately.  as it plays, a timeline will appear below the player (which is what the `<div>` elements below the `<iframe>` are for) with a progress indicated that updates while the player plays.

Methods
-------
| Function     | Arguments | Effect |
| ------------ |:---------:|:------ |
| `play()`     | *none*      | Begins playback of the embedded video |
| `pause()`    | *none*      | Pauses the embedded video (if it is playing) |
| `seek()`     | position  | Immediately seek to the `position` (in seconds, floats are accepted) of the video |
| `duration()` | callback  | Query the iframe for the duration of the video.  `callback` should accept 1 argument - an object that looks like { 'state' : 'player state', 'position': position_in_playback_in_seconds, 'duration': length_of_video_in_seconds, 'volume' : current_volume_of_video }.  Since this same object is passed to all callbacks, this is effectively a convenience function that may be renamed later on. |
| `bitrate()`  | callback | Query the iframe for the bitrate of the currently playing rendition.  `callback` should accept 1 argument - an object that looks similar to the `duration()` callback's argument, with the exception of an `args` array that contains the relevant information. |
| `videoHeight()` | callback | Query the iframe for the height of the currently playing rendition.  `callback` should accept 1 argument - an object that looks similar to the `duration()` callback's argument, with the exception of an `args` array that contains the relevant information. |
| `availableHeights()` | callback | Query the iframe for all available heights of the currently playing video.  `callback` should accept 1 argument - an object that looks similar to the `duration()` callback's argument, with the exception of an `args` array that contains the relevant information. |
| `statsForNerds()` | callback | Query the iframe for nerdy things about the currently playing video.  `callback` should accept 1 argument - an object that looks similar to the `duration()` callback's argument, with the exception of an `args` array that contains the relevant information. |
| `playerVersion()` | callback | Query the iframe for the version of the player in the frame.  `callback` should accept 1 argument - an object that looks similar to the `duration()` callback's argument, with the exception of an `args` array that contains the relevant information. |
| `on()`       | eventName, callback | Binds an event to the iframe so that when it receives a message with type `eventName`, it will call the `callback` function.  Only accepts function pointers as a callback.  Function names as strings are not accepted. |
| `one()`      | eventName, callback | Like `on()`, but the `callback` only executes once.  After that, the function should be unbound. |
| `off()`      | eventName, callback | Unbinds an event callback from the iframe.  The same function pointer that was passed in the `on()` function must be used for this to function properly |
| `enableLogging()` | *none* | Enables logging on volar object and iframe controller |
| `disableLogging()` | *none* | Disables logging on volar object and iframe controller |
| `connect()` | iframe | Connect to the given iframe dom element. |


Events
---------
The following is a list of registered events in the Iframe bridge controller that the Volarvideo.js enables listening for:

| Event Name                 | Occurs when...      |
| -------------------------- |:------------------- |
| `connected`                | Embed is successfully connected to the player api |
| `error`                    | Player api throws an error when attempting to connect to player api.  Note that callbacks for this event recieve 1 argument, and that 1 argument *should always be a javascript error object*. |
| `playerEventHover`         | User places their mouse over the player |
| `playerEventHoverOut`      | User removes their mouse from over the player |
| `onComplete`               | Video finishes playing |
| `onCurrentTimeChange`      | Video time progresses.  Fires every few milliseconds to seconds |
| `onDurationChange`         | Video duration changes.  Not a frequent occurance |
| `onLoadStateChange`        | State of video loading progress changes (buffering, initializing, etc) |
| `onMediaPlayerStateChange` | State of player changes (buffering, initializing, playing, paused, completed) |
| `onMutedChange`            | User mutes or unmutes the player |
| `onPublishMetadata`        | Metadata passes from video.  Not fully supported on archived video at this time, but is being planned |
| `onVolumeChange`           | User changes volume of player |
| `fullscreenChange`         | User changes the full-screen state of the player |
