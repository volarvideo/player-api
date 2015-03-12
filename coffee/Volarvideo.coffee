###
Volarvideo Embed controller v1.1.2
Copyright Volar Video, Inc.

Documentation on how to use is found at
	https://github.com/volarvideo/player-api
###
class @Volarvideo
	events: {}
	debug: false
	iframe: null
	channel: null
	connected: false
	retry: 5
	retryInterval: 500
	logging: false
	_mcSupport: false
	_dataSeperator: '/|\\'
	_queue: []

	constructor: (iframe = null) ->
		if iframe
			@connect iframe

	on: (event_name, callback, life = -1) ->
		if event_name is 'connected' and @connected
			callback()
		#add event to event list
		if not @events[event_name]
			@events[event_name] = []

		@events[event_name].push 
			function: callback
			life: life

	one: (event_name, callback) ->
		@on event_name, callback, 1

	trigger: (event_name, data) ->
		if @events[event_name]
			remove = []
			for i, f in @events[event_name]
				i['function'].apply(undefined, [data])
				if @events[event_name][f].life > 0
					@events[event_name][f].life--
				if @events[event_name][f].life is 0
					remove.push(i['function'])
			for i in remove
				@off event_name, i
		return

	off: (event_name, callback = null) ->
		if callback and @events[event_name]
			new_list = []
			for i in @events[event_name]
				if i['function'] isnt callback
					new_list.push i
			delete @events[event_name]
			@events[event_name] = new_list
		else
			delete @events[event_name]
		return

	play: ->
		@send 'play'

	pause: ->
		@send 'pause'

	seek: (to) ->
		@send 'seek', [to]

	duration: (callback) ->
		@one 'duration', callback
		@send 'duration'

	bitrate: (callback) ->
		@one 'bitrate', callback
		@send 'bitrate'

	videoHeight: (callback) ->
		@one 'videoHeight', callback
		@send 'videoHeight'

	availableHeights: (callback) ->
		@one 'availableHeights', callback
		@send 'availableHeights'

	statsForNerds: (callback) ->
		@one 'statsForNerds', callback
		@send 'statsForNerds'

	socialIconsVisible: (callback) ->
		@one 'socialIconsVisible', callback
		@send 'socialIconsVisible'

	setEmbedURL: (url) ->
		@send 'setEmbedURL', [url]

	playerVersion: (callback) ->
		@one 'playerVersion', callback
		@send 'playerVersion'

	enableLogging: ->
		@logging = true
		@send 'enableLogging'

	disableLogging: ->
		@logging = false
		@send 'disableLogging'

	connect: (iframe) ->
		retries = 0
		me = @
		interval = setInterval(() ->
				if me.connected
					me.log 'connected'
					clearInterval interval
				if retries >= me.retry
					me.warn 'max # of connection retries reached'
					clearInterval interval
				me.doconnect iframe
				retries++
			, @retryInterval)
		return
	doconnect: (iframe) ->
		@iframe = iframe
		me = @
		if window.MessageChannel
			@_mcSupport = true
			try

				@channel = new MessageChannel()
				@channel.port1.onmessage = (e) ->
					data = me.munchData e.data
					me.log 'data recieved: ', data
					if data.type
						switch data.type 
							when 'test'
								if data.args
									me.log 'test returned', data.args
								else
									me.log 'test returned'
							when 'connected'
								if not me.connected
									me.connected = true
									me.log("Connection to volarvideo object made")
									if me._queue.length > 0	#send messages waiting to go
										for i in me._queue
											me.send.apply(me, i)
										me._queue = []
						me.trigger(data.type, data)
					return
				@log 'sending initial message'
				@iframe.contentWindow.postMessage(JSON.stringify({'type' : 'connect'}), @iframe.src, [@channel.port2])
			catch e
				@trigger('error', e)
				@error e
				return false
			return true
		else if window.postMessage
			try
				@iframe.contentWindow.postMessage(JSON.stringify({'type' : 'connect'}), @iframe.src)
				window.addEventListener "message", ((e) ->
								data = me.munchData e.data
								me.log 'data recieved: ', data
								if data.type
									switch data.type 
										when 'test'
											if data.args
												me.log 'test returned', data.args
											else
												me.log 'test returned'
										when 'connected'
											if not me.connected
												me.connected = true
												me.log("Connection to volarvideo object made")
												if me._queue.length > 0	#send messages waiting to go
													for i in me._queue
														me.send.apply(me, i)
													me._queue = []
									me.trigger(data.type, data)
								return), false
			catch e
				@trigger('error', e)
				@error e
				return false

			return true
		else
			@trigger('error', new Error('cannot connect to iframe channel - window.MessageChannel not supported'))
			@error 'cannot connect to iframe channel - window.MessageChannel not supported'
			return false
	disconnect: ->
		@iframe = null
		@channel = null
		@connected = false
		return true

	send: (type, args = null) ->
		if @connected
			try
				@iframe.contentWindow.postMessage @prepareData(type, args), @iframe.src
			catch e
				@error e
				return false
			return true
		else
			@_queue.push [type, args]
			return false

	prepareData: (type, args = null) ->
		d = 
			type: type
			args: []
		if args isnt null
			d.args = args
		return JSON.stringify(d)

	munchData: (data) ->
		return JSON.parse(data)

	log: (message...) ->
		if @logging and window.console and console.log
			message.unshift '{local}'
			console.log.apply console, message
	warn: (message...) ->
		if @logging and window.console and console.warn
			message.unshift '{local}'
			console.warn.apply console, message
	error: (message...) ->
		if @logging and window.console and console.error
			message.unshift '{local}'
			console.error.apply console, message

###
json2.js, from https://github.com/douglascrockford/JSON-js
###
`"object"!==typeof this.JSON&&(this.JSON={});
(function(){function l(a){return 10>a?"0"+a:a}function q(a){r.lastIndex=0;return r.test(a)?'"'+a.replace(r,function(a){var c=t[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function n(a,k){var c,d,h,p,g=e,f,b=k[a];b&&("object"===typeof b&&"function"===typeof b.toJSON)&&(b=b.toJSON(a));"function"===typeof j&&(b=j.call(k,a,b));switch(typeof b){case "string":return q(b);case "number":return isFinite(b)?String(b):"null";case "boolean":case "null":return String(b);
case "object":if(!b)return"null";e+=m;f=[];if("[object Array]"===Object.prototype.toString.apply(b)){p=b.length;for(c=0;c<p;c+=1)f[c]=n(c,b)||"null";h=0===f.length?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if(j&&"object"===typeof j){p=j.length;for(c=0;c<p;c+=1)"string"===typeof j[c]&&(d=j[c],(h=n(d,b))&&f.push(q(d)+(e?": ":":")+h))}else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=n(d,b))&&f.push(q(d)+(e?": ":":")+h);h=0===f.length?"{}":e?"{\n"+e+f.join(",\n"+
e)+"\n"+g+"}":"{"+f.join(",")+"}";e=g;return h}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+l(this.getUTCMonth()+1)+"-"+l(this.getUTCDate())+"T"+l(this.getUTCHours())+":"+l(this.getUTCMinutes())+":"+l(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var s=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
r=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,m,t={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},j;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,k,c){var d;m=e="";if("number"===typeof c)for(d=0;d<c;d+=1)m+=" ";else"string"===typeof c&&(m=c);if((j=k)&&"function"!==typeof k&&("object"!==typeof k||"number"!==typeof k.length))throw Error("JSON.stringify");return n("",{"":a})});
"function"!==typeof JSON.parse&&(JSON.parse=function(a,e){function c(a,d){var g,f,b=a[d];if(b&&"object"===typeof b)for(g in b)Object.prototype.hasOwnProperty.call(b,g)&&(f=c(b,g),void 0!==f?b[g]=f:delete b[g]);return e.call(a,d,b)}var d;a=String(a);s.lastIndex=0;s.test(a)&&(a=a.replace(s,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),"function"===typeof e?c({"":d},""):d;throw new SyntaxError("JSON.parse");})})();`