/*
Volarvideo Embed controller v1.1.2
Copyright Volar Video, Inc.

Documentation on how to use is found at
	https://github.com/volarvideo/player-api
*/


(function() {
  var __slice = [].slice;

  this.Volarvideo = (function() {
    Volarvideo.prototype.events = {};

    Volarvideo.prototype.debug = false;

    Volarvideo.prototype.iframe = null;

    Volarvideo.prototype.channel = null;

    Volarvideo.prototype.connected = false;

    Volarvideo.prototype.retry = 5;

    Volarvideo.prototype.retryInterval = 500;

    Volarvideo.prototype.logging = false;

    Volarvideo.prototype._mcSupport = false;

    Volarvideo.prototype._dataSeperator = '/|\\';

    Volarvideo.prototype._queue = [];

    function Volarvideo(iframe) {
      if (iframe == null) {
        iframe = null;
      }
      if (iframe) {
        this.connect(iframe);
      }
    }

    Volarvideo.prototype.on = function(event_name, callback, life) {
      if (life == null) {
        life = -1;
      }
      if (event_name === 'connected' && this.connected) {
        callback();
      }
      if (!this.events[event_name]) {
        this.events[event_name] = [];
      }
      return this.events[event_name].push({
        "function": callback,
        life: life
      });
    };

    Volarvideo.prototype.one = function(event_name, callback) {
      return this.on(event_name, callback, 1);
    };

    Volarvideo.prototype.trigger = function(event_name, data) {
      var f, i, remove, _i, _j, _len, _len1, _ref;
      if (this.events[event_name]) {
        remove = [];
        _ref = this.events[event_name];
        for (f = _i = 0, _len = _ref.length; _i < _len; f = ++_i) {
          i = _ref[f];
          i['function'].apply(void 0, [data]);
          if (this.events[event_name][f].life > 0) {
            this.events[event_name][f].life--;
          }
          if (this.events[event_name][f].life === 0) {
            remove.push(i['function']);
          }
        }
        for (_j = 0, _len1 = remove.length; _j < _len1; _j++) {
          i = remove[_j];
          this.off(event_name, i);
        }
      }
    };

    Volarvideo.prototype.off = function(event_name, callback) {
      var i, new_list, _i, _len, _ref;
      if (callback == null) {
        callback = null;
      }
      if (callback && this.events[event_name]) {
        new_list = [];
        _ref = this.events[event_name];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          if (i['function'] !== callback) {
            new_list.push(i);
          }
        }
        delete this.events[event_name];
        this.events[event_name] = new_list;
      } else {
        delete this.events[event_name];
      }
    };

    Volarvideo.prototype.play = function() {
      return this.send('play');
    };

    Volarvideo.prototype.pause = function() {
      return this.send('pause');
    };

    Volarvideo.prototype.seek = function(to) {
      return this.send('seek', [to]);
    };

    Volarvideo.prototype.duration = function(callback) {
      this.one('duration', callback);
      return this.send('duration');
    };

    Volarvideo.prototype.bitrate = function(callback) {
      this.one('bitrate', callback);
      return this.send('bitrate');
    };

    Volarvideo.prototype.videoHeight = function(callback) {
      this.one('videoHeight', callback);
      return this.send('videoHeight');
    };

    Volarvideo.prototype.availableHeights = function(callback) {
      this.one('availableHeights', callback);
      return this.send('availableHeights');
    };

    Volarvideo.prototype.statsForNerds = function(callback) {
      this.one('statsForNerds', callback);
      return this.send('statsForNerds');
    };

    Volarvideo.prototype.socialIconsVisible = function(callback) {
      this.one('socialIconsVisible', callback);
      return this.send('socialIconsVisible');
    };

    Volarvideo.prototype.setEmbedURL = function(url) {
      return this.send('setEmbedURL', [url]);
    };

    Volarvideo.prototype.playerVersion = function(callback) {
      this.one('playerVersion', callback);
      return this.send('playerVersion');
    };

    Volarvideo.prototype.enableLogging = function() {
      this.logging = true;
      return this.send('enableLogging');
    };

    Volarvideo.prototype.disableLogging = function() {
      this.logging = false;
      return this.send('disableLogging');
    };

    Volarvideo.prototype.connect = function(iframe) {
      var interval, me, retries;
      retries = 0;
      me = this;
      interval = setInterval(function() {
        if (me.connected) {
          me.log('connected');
          clearInterval(interval);
        }
        if (retries >= me.retry) {
          me.warn('max # of connection retries reached');
          clearInterval(interval);
        }
        me.doconnect(iframe);
        return retries++;
      }, this.retryInterval);
    };

    Volarvideo.prototype.doconnect = function(iframe) {
      var e, me;
      this.iframe = iframe;
      me = this;
      if (window.MessageChannel) {
        this._mcSupport = true;
        try {
          this.channel = new MessageChannel();
          this.channel.port1.onmessage = function(e) {
            var data, i, _i, _len, _ref;
            data = me.munchData(e.data);
            me.log('data recieved: ', data);
            if (data.type) {
              switch (data.type) {
                case 'test':
                  if (data.args) {
                    me.log('test returned', data.args);
                  } else {
                    me.log('test returned');
                  }
                  break;
                case 'connected':
                  if (!me.connected) {
                    me.connected = true;
                    me.log("Connection to volarvideo object made");
                    if (me._queue.length > 0) {
                      _ref = me._queue;
                      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        i = _ref[_i];
                        me.send.apply(me, i);
                      }
                      me._queue = [];
                    }
                  }
              }
              me.trigger(data.type, data);
            }
          };
          this.log('sending initial message');
          this.iframe.contentWindow.postMessage(JSON.stringify({
            'type': 'connect'
          }), this.iframe.src, [this.channel.port2]);
        } catch (_error) {
          e = _error;
          this.trigger('error', e);
          this.error(e);
          return false;
        }
        return true;
      } else if (window.postMessage) {
        try {
          this.iframe.contentWindow.postMessage(JSON.stringify({
            'type': 'connect'
          }), this.iframe.src);
          window.addEventListener("message", (function(e) {
            var data, i, _i, _len, _ref;
            data = me.munchData(e.data);
            me.log('data recieved: ', data);
            if (data.type) {
              switch (data.type) {
                case 'test':
                  if (data.args) {
                    me.log('test returned', data.args);
                  } else {
                    me.log('test returned');
                  }
                  break;
                case 'connected':
                  if (!me.connected) {
                    me.connected = true;
                    me.log("Connection to volarvideo object made");
                    if (me._queue.length > 0) {
                      _ref = me._queue;
                      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        i = _ref[_i];
                        me.send.apply(me, i);
                      }
                      me._queue = [];
                    }
                  }
              }
              me.trigger(data.type, data);
            }
          }), false);
        } catch (_error) {
          e = _error;
          this.trigger('error', e);
          this.error(e);
          return false;
        }
        return true;
      } else {
        this.trigger('error', new Error('cannot connect to iframe channel - window.MessageChannel not supported'));
        this.error('cannot connect to iframe channel - window.MessageChannel not supported');
        return false;
      }
    };

    Volarvideo.prototype.disconnect = function() {
      this.iframe = null;
      this.channel = null;
      this.connected = false;
      return true;
    };

    Volarvideo.prototype.send = function(type, args) {
      var e;
      if (args == null) {
        args = null;
      }
      if (this.connected) {
        try {
          this.iframe.contentWindow.postMessage(this.prepareData(type, args), this.iframe.src);
        } catch (_error) {
          e = _error;
          this.error(e);
          return false;
        }
        return true;
      } else {
        this._queue.push([type, args]);
        return false;
      }
    };

    Volarvideo.prototype.prepareData = function(type, args) {
      var d;
      if (args == null) {
        args = null;
      }
      d = {
        type: type,
        args: []
      };
      if (args !== null) {
        d.args = args;
      }
      return JSON.stringify(d);
    };

    Volarvideo.prototype.munchData = function(data) {
      return JSON.parse(data);
    };

    Volarvideo.prototype.log = function() {
      var message;
      message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logging && window.console && console.log) {
        message.unshift('{local}');
        return console.log.apply(console, message);
      }
    };

    Volarvideo.prototype.warn = function() {
      var message;
      message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logging && window.console && console.warn) {
        message.unshift('{local}');
        return console.warn.apply(console, message);
      }
    };

    Volarvideo.prototype.error = function() {
      var message;
      message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logging && window.console && console.error) {
        message.unshift('{local}');
        return console.error.apply(console, message);
      }
    };

    return Volarvideo;

  })();

  /*
  json2.js, from https://github.com/douglascrockford/JSON-js
  */


  "object"!==typeof this.JSON&&(this.JSON={});
(function(){function l(a){return 10>a?"0"+a:a}function q(a){r.lastIndex=0;return r.test(a)?'"'+a.replace(r,function(a){var c=t[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function n(a,k){var c,d,h,p,g=e,f,b=k[a];b&&("object"===typeof b&&"function"===typeof b.toJSON)&&(b=b.toJSON(a));"function"===typeof j&&(b=j.call(k,a,b));switch(typeof b){case "string":return q(b);case "number":return isFinite(b)?String(b):"null";case "boolean":case "null":return String(b);
case "object":if(!b)return"null";e+=m;f=[];if("[object Array]"===Object.prototype.toString.apply(b)){p=b.length;for(c=0;c<p;c+=1)f[c]=n(c,b)||"null";h=0===f.length?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if(j&&"object"===typeof j){p=j.length;for(c=0;c<p;c+=1)"string"===typeof j[c]&&(d=j[c],(h=n(d,b))&&f.push(q(d)+(e?": ":":")+h))}else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=n(d,b))&&f.push(q(d)+(e?": ":":")+h);h=0===f.length?"{}":e?"{\n"+e+f.join(",\n"+
e)+"\n"+g+"}":"{"+f.join(",")+"}";e=g;return h}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+l(this.getUTCMonth()+1)+"-"+l(this.getUTCDate())+"T"+l(this.getUTCHours())+":"+l(this.getUTCMinutes())+":"+l(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var s=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
r=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,m,t={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},j;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,k,c){var d;m=e="";if("number"===typeof c)for(d=0;d<c;d+=1)m+=" ";else"string"===typeof c&&(m=c);if((j=k)&&"function"!==typeof k&&("object"!==typeof k||"number"!==typeof k.length))throw Error("JSON.stringify");return n("",{"":a})});
"function"!==typeof JSON.parse&&(JSON.parse=function(a,e){function c(a,d){var g,f,b=a[d];if(b&&"object"===typeof b)for(g in b)Object.prototype.hasOwnProperty.call(b,g)&&(f=c(b,g),void 0!==f?b[g]=f:delete b[g]);return e.call(a,d,b)}var d;a=String(a);s.lastIndex=0;s.test(a)&&(a=a.replace(s,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),"function"===typeof e?c({"":d},""):d;throw new SyntaxError("JSON.parse");})})();;

}).call(this);
