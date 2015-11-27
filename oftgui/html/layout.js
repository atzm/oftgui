'use strict';

var layout = (function() {
    var ForceLayoutManager = function(svg, nodeImage) {
        var self = this;

        self.svg       = svg;
        self.nodeImage = nodeImage;

        self.handlers = {};

        self.links  = self.svg.selectAll('.svg-link');
        self.nodes  = self.svg.selectAll('.svg-node');
        self.ports  = self.svg.selectAll('.svg-port');
        self.traces = self.svg.selectAll('.svg-trace');

        self.layout = d3.layout.force()
            .size([svg.attr('width'), svg.attr('height')])
            .charge(-500)
            .friction(0.9)
            .gravity(0.05)
            .linkDistance(150)
            .on('tick', function(d) {
                if (self.handlers['tick']) {
                    self.handlers['tick'](d);
                }
            });

        self.drag = self.layout.drag()
            .on('dragstart', function(d) {
                if (self.handlers['dragstart']) {
                    self.handlers['dragstart'](d);
                }
            });

        var defs = self.svg.append('defs');

        defs.append('marker')
            .attr({
                id:           'fwarrow',
                refX:         40,
                refY:         5,
                markerWidth:  10,
                markerHeight: 10,
                orient:       'auto',
            })
            .append('path')
            .attr({
                d:      'M0,0 V10 L10,5 Z',
                fill:   'crimson',
                stroke: 'ghostwhite',
            });
        defs.append('marker')
            .attr({
                id:           'rvarrow',
                refX:         120,
                refY:         5,
                markerWidth:  10,
                markerHeight: 10,
                orient:       'auto',
            })
            .append('path')
            .attr({
                d:      'M10,0 V10 L0,5 Z',
                fill:   'crimson',
                stroke: 'ghostwhite',
            });
    };

    ForceLayoutManager.prototype.onTick = function(handler) {
        var self = this;

        self.handlers['tick'] = handler;
    };

    ForceLayoutManager.prototype.onDragStart = function(handler) {
        var self = this;

        self.handlers['dragstart'] = handler;
    };

    ForceLayoutManager.prototype.onTraceMarkClick = function(handler) {
        var self = this;

        self.handlers['tracemarkclick'] = handler;
    };

    ForceLayoutManager.prototype.update = function(nodes, links, ports, stats) {
        var self = this;

        self.layout.nodes(nodes).links(links).start();

        self.links.remove();
        self.links = self.svg.selectAll('.svg-link').data(links);

        self.links.enter()
            .append('line')
            .attr('class', 'svg-link')
            .attr('marker-end', function(d) {
                if (!d.trace) {
                    return;
                }
                return d.trace.linkDirection
                    ? 'url(#fwarrow)'
                    : 'url(#rvarrow)';
            })
            .attr('stroke', function(d) {
                return d.trace ? 'crimson' : 'navy';
            });

        self.nodes.remove();
        self.nodes = self.svg.selectAll('.svg-node').data(nodes);

        var gn = self.nodes.enter()
            .append('g')
            .attr('class', 'svg-node')
            .on('dblclick', function(d) {
                d3.select(this).classed('fixed', d.fixed = !d.fixed);
            })
            .call(self.drag);

        gn.append('image')
            .attr({
                'xlink:href': self.nodeImage.href,
                x:            self.nodeImage.width / -2,
                y:            self.nodeImage.height / -2,
                width:        self.nodeImage.width,
                height:       self.nodeImage.height,
            });
        gn.append('text')
            .attr({
                dx:          -60,
                dy:          30,
                'font-size': '12px',
            })
            .text(function(d) {
                return d.dpid;
            });

        self.ports.remove();
        self.ports = self.svg.selectAll('.svg-port').data(ports);

        var gp = self.ports.enter()
            .append('g')
            .attr('class', 'svg-port');

        gp.append('circle')
            .attr({
                r:      7,
                fill:   'rgba(255,245,155,0.9)',
                stroke: 'ghostwhite',
            });

        gp.append('text')
            .attr({
                'font-size': '10px',
                fill:        'darkgreen',
            })
            .attr('dy', '3')
            .attr('dx', function(d) {
                return -1 - util.hexstr2number(d.portNo).toString().length * 2;
            })
            .text(function(d) {
                return util.hexstr2number(d.portNo);
            });

        self.traces.remove();
        self.traces = self.svg.selectAll('.svg-trace').data(stats);

        var gt = self.traces.enter()
            .append('g')
            .attr('class', 'svg-trace')
            .on('mouseover', function(d) {
                if (self.handlers['tracemarkclick']) {
                    d3.select(this).style('cursor', 'pointer');
                }
            })
            .on('click', function(d) {
                if (self.handlers['tracemarkclick']) {
                    self.handlers['tracemarkclick'](d);
                }
            });

        gt.append('circle')
            .attr({
                r:      9,
                fill:   'crimson',
                stroke: 'ghostwhite',
            });

        gt.append('text')
            .attr({
                'font-size': '10px',
                fill:        'ghostwhite',
            })
            .attr('dy', '3')
            .attr('dx', function(d) {
                return -1 - d.number.toString().length * 2;
            })
            .text(function(d) {
                return d.number;
            });

        gt.append('text')
            .attr({
                'font-size': '10px',
                fill:        'crimson',
            })
            .attr('dy', '20')
            .attr('dx', function(d) {
                return -9 - d.number.toString().length * 2;
            })
            .text(function(d) {
                return Math.ceil(d.time * 1000) + ' ms';
            });
    };

    var ModalManager = function(title) {
        var self = this;

        self.title_text = title;
        self.handlers   = {};
        self.modal      = $('#x-modal');
        self.title      = $('#x-modal-title');
        self.body       = $('#x-modal-body');
        self.progress   = $('#x-modal-progress');
    };

    ModalManager.prototype.onRender = function(handler) {
        var self = this;

        self.handlers['render'] = handler;
    };

    ModalManager.prototype.clearBody = function() {
        var self = this;

        self.body.html('');
    };

    ModalManager.prototype.render = function() {
        var self   = this;
        var render = self.handlers['render'] || new Function();

        self.progress.fadeIn(undefined, function() {
            self.modal.modal();

            self.title.fadeOut(undefined, function() {
                self.title.html(self.title_text);
                self.title.fadeIn();
            });

            self.body.fadeOut(undefined, function() {
                render();
                self.progress.fadeOut();
                self.body.fadeIn();
            });
        });
    };

    return {
        ForceLayoutManager: ForceLayoutManager,
        ModalManager:       ModalManager,
    };
})();
