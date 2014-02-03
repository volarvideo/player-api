###
This file is meant to be an example for how to use the Volar player api.   
It contains 2 functions, initMC and getDuration.
When index.html is loaded, the file's onload event triggers initMC, which
binds event listeners to the volar embed in the page.
###

@i = null
@v = null
me = @
@initMC = ->
	debugdiv = document.getElementById 'debug-info'
	debugprogress = document.getElementById 'debug-progress'
	controls = document.getElementById 'controls'
	me.i = document.getElementById 'frame'
	me.v = new Volarvideo;
	me.v.connect(me.i)
	me.v.on 'onComplete', (data) ->
		me.v.log('video completed')
		return
	me.v.on 'onPublishMetaData', (data) ->
		console.log data
	me.v.on 'onCurrentTimeChange', (data) ->
		debugdiv.innerHTML = "Current State: #{data.state}, Total duration of video: #{data.duration}, current position: #{data.position}"
		percent = (data.position / data.duration) * 100
		debugprogress.style.width = percent + '%'
	me.v.on 'onMediaPlayerStateChange', (data) ->
		controls.className = data.state
	me.v.duration me.getDuration
	me.v.play()
	# me.v.seek(50)
	return

@play = ->
	me.v.play()
@pause = ->
	me.v.pause()
@seek = (seconds) ->
	me.v.seek(seconds)

@getDuration = (data) ->
	console.log "state is #{data.state}, #{data.duration} is the current duration, and the current position is #{data.position}"
