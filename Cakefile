fs = require 'fs'
{exec} = require 'child_process'

srcDir = './coffee'
binDir = './js'

task 'build', 'build project', (options) ->
	exec "coffee --compile --output #{binDir} #{srcDir}", (e, o, se) ->
		if e
			console.error "Error during compilation"
			console.error se
			process.exit 1
		console.log "Compilation successful"
	
task 'watch', 'watch project', (options) ->
	res  = exec "coffee --compile --watch --output #{binDir} #{srcDir}"
	res.stderr.on 'data', (data) ->
		console.error stripEndline(data)
	res.stdout.on 'data', (data) ->
		if /compiled src/.test data
			process.stdout.write data
		else
			process.stderr.write data
			# m = data.match /^In src\/(.*)\.coffee/
			# if m and m[1]




stripEndline = (str) ->
	return str.slice(0, str.length - 1) if str[str.length - 1] is "\n"
	return str