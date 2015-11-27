'use strict';

var topology = (function() {
    var TopologyManager = function() {
        var self = this;

        self.nodes     = [];
        self.links     = [];
        self.ports     = {};
        self.nodeIndex = {};
    };

    TopologyManager.prototype.isVisibleLink = function(link) {
        return (link.src.dpid < link.dst.dpid);
    };

    TopologyManager.prototype.getPortKey = function(dpid, portNo) {
        return [dpid, portNo].join(':');
    };

    TopologyManager.prototype.getNodeIndex = function(dpid) {
        var self = this;
        var idx  = self.nodeIndex[dpid];

        return idx == null ? -1 : idx;
    };

    TopologyManager.prototype.updateNodeIndex = function() {
        var self = this;

        self.nodeIndex = {};

        for (var i = 0; i < self.nodes.length; i++) {
            self.nodeIndex[self.nodes[i].dpid] = i;
        }
    };

    TopologyManager.prototype.getPort = function(dpid, portNo) {
        var self = this;

        return self.ports[self.getPortKey(dpid, portNo)];
    };

    TopologyManager.prototype.getPorts = function() {
        var self  = this;
        var ports = [];

        for (var key in self.ports) {
            ports.push(self.ports[key]);
        }

        return ports;
    };

    TopologyManager.prototype.addPort = function(port) {
        var self = this;
        var key  = self.getPortKey(port.dpid, port.portNo);

        if (!self.ports.hasOwnProperty(key)) {
            self.ports[key] = port;
        }
    };

    TopologyManager.prototype.removePort = function(port) {
        var self = this;

        delete self.ports[self.getPortKey(port.dpid, port.portNo)];
    };

    TopologyManager.prototype.getLinkIndex = function(link) {
        var self  = this;
        var ilink = null;

        for (var i = 0; i < self.links.length; i++) {
            ilink = self.links[i];

            if (link.src.dpid    == ilink.port.src.dpid &&
                link.src.port_no == ilink.port.src.portNo &&
                link.dst.dpid    == ilink.port.dst.dpid &&
                link.dst.port_no == ilink.port.dst.portNo) {
                return i;
            }
        }

        return -1;
    };

    TopologyManager.prototype.getLinkIndexByPort = function(port) {
        var self  = this;
        var ilink = null;

        for (var i = 0; i < self.links.length; i++) {
            ilink = self.links[i];

            if ((port.dpid   == ilink.port.dst.dpid &&
                 port.portNo == ilink.port.dst.portNo) ||
                (port.dpid   == ilink.port.src.dpid &&
                 port.portNo == ilink.port.src.portNo)) {
                return i;
            }
        }

        return -1;
    };

    TopologyManager.prototype.getLinkTraceState = function() {
        var self = this;
        var stat = [];

        for (var i = 0; i < self.links.length; i++) {
            if (self.links[i].trace) {
                stat.push(self.links[i].trace);
            }
        }

        return stat;
    };

    TopologyManager.prototype.setLinkTraceState = function(data) {
        var self = this;
        var port = self.getPort(data.dpid, data.port);

        if (port) {
            var idx = self.getLinkIndexByPort(port);

            if (idx >= 0) {
                self.links[idx].trace = {
                    dpid:          data.dpid,
                    port:          data.port,
                    data:          data.data,
                    loop:          data.loop,
                    number:        data.number,
                    time:          data.time,
                    linkIndex:     idx,
                    linkDirection: port.linkDirection,
                };
            }
        }
    };

    TopologyManager.prototype.clearLinkTraceState = function() {
        var self = this;

        for (var i = 0; i < self.links.length; i++) {
            self.links[i].trace = null;
        }
    };

    TopologyManager.prototype.addNodes = function(nodes) {
        var self = this;

        for (var i = 0; i < nodes.length; i++) {
            self.nodes.push(nodes[i]);
        }

        self.updateNodeIndex();
    };

    TopologyManager.prototype.removeNodes = function(nodes) {
        var self = this;

        for (var i = 0; i < nodes.length; i++) {
            var idx = self.getNodeIndex(nodes[i].dpid);

            if (idx >= 0) {
                self.nodes.splice(idx, 1);
                self.updateNodeIndex();
            }
        }
    };

    TopologyManager.prototype.addLinks = function(links) {
        var self = this;

        for (var i = 0; i < links.length; i++) {
            if (!self.isVisibleLink(links[i]))
                continue;

            var srcDpid  = links[i].src.dpid;
            var dstDpid  = links[i].dst.dpid;
            var srcIndex = self.nodeIndex[srcDpid];
            var dstIndex = self.nodeIndex[dstDpid];

            if (srcIndex == null || dstIndex == null) {
                continue;
            }

            var srcPort = {
                dpid:          links[i].src.dpid,
                portNo:        links[i].src.port_no,
                linkIndex:     self.links.length,
                linkDirection: false,
            };
            var dstPort = {
                dpid:          links[i].dst.dpid,
                portNo:        links[i].dst.port_no,
                linkIndex:     self.links.length,
                linkDirection: true,
            };

            self.links.push({ 
                source: srcIndex,
                target: dstIndex,
                trace:  null,
                port:   {   
                    src: srcPort,
                    dst: dstPort,
                },  
            });
            self.addPort(srcPort);
            self.addPort(dstPort);
        }
    };

    TopologyManager.prototype.removeLinks = function(links) {
        var self = this;

        for (var i = 0; i < links.length; i++) {
            if (!self.isVisibleLink(links[i]))
                continue;

            var idx = self.getLinkIndex(links[i]);

            if (idx >= 0) {
                self.removePort(self.links[idx].port.src);
                self.removePort(self.links[idx].port.dst);
                self.links.splice(idx, 1);
            }
        }
    };

    return {
        TopologyManager: TopologyManager,
    };
})();
