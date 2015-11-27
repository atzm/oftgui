'use strict';

var util = (function() {
    var isGraph = function(code) {
        return (32 < code && code < 127);
    };

    var hexstr2string = function(hexstr) {
        var chars = splitString(hexstr, 2);

        for (var i = 0; i < chars.length; i++) {
            var code = hexstr2number(chars[i]);
            chars[i] = isGraph(code) ? String.fromCharCode(code) : '.';
        }

        return chars.join('');
    };

    var hexstr2number = function(hexstr) {
        return Number('0x' + hexstr);
    };

    var number2hexstr = function(num, len, head) {
        len  = len  ? len  : 0;
        head = head ? '0x' : '';

        return head +
            ((new Array(len).join('0')) + num.toString(16)).substr(-len);
    };

    var splitString = function(str, len) {
        var data = [];

        for (var i  = 0; i < str.length; i += len) {
            data.push(str.substr(i, len));
        }

        return data;
    };

    var stripStats = function(entry) {
        var elements = entry.split(',');
        var stripped = [];
        var trimmed  = null;

        for (var i = 0; i < elements.length; i++) {
            trimmed = elements[i].trim();

            if (trimmed.indexOf('duration=')  == 0 ||
                trimmed.indexOf('n_packets=') == 0 ||
                trimmed.indexOf('n_bytes=')   == 0 ||
                trimmed.indexOf('buffer=')    == 0) {
                continue;
            }

            stripped.push(trimmed);
        }

        return stripped.join(',');
    };

    return {
        isGraph:       isGraph,
        hexstr2string: hexstr2string,
        hexstr2number: hexstr2number,
        number2hexstr: number2hexstr,
        splitString:   splitString,
        stripStats:    stripStats,
    };
})();
