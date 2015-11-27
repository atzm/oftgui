'use strict';

var websocket = (function() {
    var WebSocketManager = function(url, handlers) {
        var self = this;

        self.ws       = null;
        self.url      = url;
        self.handlers = handlers;
    };

    WebSocketManager.prototype.isStarted = function() {
        var self = this;

        return self.ws ? true : false;
    };

    WebSocketManager.prototype.start = function(onopen, onclose, onerror) {
        var self = this;

        if (self.isStarted()) {
            console.log('websocket already started: ' + self.url);
            return;
        }

        self.ws           = new WebSocket(self.url);
        self.ws.onopen    = onopen || function() {};
        self.ws.onmessage = function(evt) {
            var data    = JSON.parse(evt.data);
            var handler = self.handlers[data.method];
            var result  = null;

            if (handler) {
                result = handler(data.params);
            }
            else {
                console.log('received unknown method: ' + evt.data);
            }

            if (result == null) {
                result = 'ack';
            }

            this.send(JSON.stringify({
                id:      data.id,
                jsonrpc: data.jsonrpc,
                result:  result,
            }));
        };
        self.ws.onclose = function(evt) {
            if (onclose) {
                onclose(evt);
            }
            self.ws = null;
        };
        self.ws.onerror = function(evt) {
            if (onerror) {
                onerror(evt);
            }
            console.log(evt);
        };
    };

    WebSocketManager.prototype.stop = function(status, reason) {
        var self = this;

        self.ws.close(status || 1000, reason);
    };

    return {
        WebSocketManager: WebSocketManager,
    };
})();
