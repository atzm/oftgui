'use strict';

var oftrace = (function() {
    var PacketData = null;

    var openFlowEntriesModal = function(dpid) {
        var path  = '/oftrace/switches/' + dpid + '/flows';
        var modal = new layout.ModalManager([
            '<span class="glyphicon glyphicon-transfer"></span> ',
            'Flow Entries > ' + dpid,
        ].join(''));

        var createModal = function(data) {
            var body  = d3.select('#x-modal-body');
            var tbody = body.append('table')
                .attr('class', 'table table-hover')
                .append('tbody');

            var listRow = tbody.selectAll('tr')
                .data(data)
                .enter()
                .append('tr');
            var removeButton = listRow.append('td')
                .append('button')
                .attr({
                    class: 'btn btn-danger',
                    type:  'button',
                });
            listRow.append('td')
                .append('pre')
                .attr('class', 'pre-scrollable')
                .append('code')
                .text(function(d) { return d; });
            removeButton.append('span')
                .attr('class', 'glyphicon glyphicon-minus');
            removeButton.on('click', function(d) {
                var req = JSON.stringify({entry: util.stripStats(d)});

                removeButton.classed('disabled', true);
                addButton.classed('disabled', true);

                d3.xhr(path)
                    .header('Content-type', 'application/json')
                    .send('DELETE', req, function(e, r) {
                        if (e) {
                            console.log(e);
                        }
                        modal.render();
                    });
            });

            var addRow = tbody.append('tr');
            var addButton = addRow.append('td')
                .append('button')
                .attr({
                    class: 'btn btn-info',
                    type:  'button',
                });
            addRow.append('td')
                .append('input')
                .attr({
                    id:          'input-add-flow',
                    type:        'text',
                    placeholder: 'add flow entry...',
                    class:       'form-control',
                });
            addButton.append('span')
                .attr('class', 'glyphicon glyphicon-plus');
            addButton.on('click', function() {
                var flow = util.stripStats($('#input-add-flow').val());

                if (!flow) {
                    return;
                }

                var req = JSON.stringify({entry: flow});

                removeButton.classed('disabled', true);
                addButton.classed('disabled', true);

                d3.xhr(path)
                    .header('Content-type', 'application/json')
                    .send('PUT', req, function(e, r) {
                        if (e) {
                            console.log(e);
                        }
                        modal.render();
                    });
            });
        };

        modal.onRender(function() {
            d3.json(path, function(e, data) {
                modal.clearBody();
                createModal(data);
            });
        });

        modal.clearBody();
        modal.render();
    };

    var openTracerouteModal = function(dpid, prepare, handler) {
        prepare = prepare || new Function();
        handler = handler || new Function();

        var modal = new layout.ModalManager([
            '<span class="glyphicon glyphicon-random"></span> ',
            'Traceroute > ' + dpid,
        ].join(''));

        var createButtonGroup = function(label, buttonGroup, data, tcb, vcb) {
            buttonGroup.attr('class', 'btn-group');

            var labelBtn = buttonGroup.append('button')
                .attr({
                    type:             'button',
                    class:            'btn btn-default',
                    'dropdown-value': '',
                })
                .text(label);
            buttonGroup.append('button')
                .attr({
                    type:            'button',
                    class:           'btn btn-default dropdown-toggle',
                    'data-toggle':   'dropdown',
                    'aria-haspopup': 'true',
                    'aria-expanded': 'false',
                })
                .append('span')
                .attr('class', 'caret');
            buttonGroup.append('ul')
                .attr('class', 'dropdown-menu')
                .selectAll('li')
                .data(data)
                .enter()
                .append('li')
                .append('a')
                .attr('href', '#')
                .text(function(d) {
                    return tcb(d);
                })
                .on('click', function(d) {
                    labelBtn.text(tcb(d));
                    labelBtn.attr('dropdown-value', vcb(d));
                });

            return labelBtn;
        };

        var createModal = function(data) {
            var body = d3.select('#x-modal-body');
            var trow = body.append('table')
                .attr('class', 'table table-hover')
                .append('tbody')
                .append('tr');

            var submitButton = trow.append('td')
                .append('button')
                .attr({
                    type:  'submit',
                    class: 'btn btn-primary',
                });
            var inPortButtonGroup = trow.append('td')
                .append('div');
            var inPortLabelButton = createButtonGroup(
                'Input Port', inPortButtonGroup, data.ports,
                function(d) {
                    return util.hexstr2number(d.port_no) + ' (' + d.name + ')';
                },
                function(d) {
                    return d.port_no;
                });
            var packetButtonGroup = trow.append('td')
                .append('div');
            var packetLabelButton = createButtonGroup(
                'Probe Frame', packetButtonGroup, PacketData,
                function(d) {
                    return d.name;
                },
                function(d) {
                    return d.data;
                });
            trow.append('td')
                .append('input')
                .attr({
                    id:          'input-trace-timeout',
                    type:        'text',
                    placeholder: 'timeout in seconds',
                    class:       'form-control',
                });

            submitButton.append('span')
                .attr('class', 'glyphicon glyphicon-play');
            submitButton.on('click', function() {
                var port    = inPortLabelButton.attr('dropdown-value');
                var packet  = packetLabelButton.attr('dropdown-value');
                var timeout = $('#input-trace-timeout').val();

                if (!port || !packet) {
                    alert('please select input port and probe frame.');
                    return;
                }

                if (timeout == '') {
                    timeout = 2.0;
                }
                else {
                    timeout = Number(timeout);
                }

                if (isNaN(timeout) || timeout < 1.0 || timeout > 60.0) {
                    alert('1.0 <= timeout <= 60.0');
                    return;
                }

                var path  = '/oftrace/probes';
                var prreq = JSON.stringify({data: packet});
                var streq = JSON.stringify({dpid: dpid, port: port});

                d3.xhr(path)
                    .header('Content-type', 'application/json')
                    .post(prreq, function(e, r) {
                        if (e) {
                            console.log(e);
                            return;
                        }

                        var result = JSON.parse(r.response);
                        var ppath  = path + '/' + result.id;
                        var wsurl  = 'ws://' + location.host +
                            '/oftrace/snoop' + '/' + result.id;

                        var wsmgr = new websocket.WebSocketManager(wsurl, {
                            'oftrace.ProbeIn': function(params) {
                                handler(params);
                            },
                        });

                        wsmgr.start(function() {
                            d3.xhr(ppath)
                                .header('Content-type', 'application/json')
                                .send('PUT', streq, function() {
                                    setTimeout(function() {
                                        wsmgr.stop();
                                        d3.xhr(ppath).send('DELETE');
                                    }, timeout * 1000);
                                });
                        });
                    });

                prepare();
                modal.modal.modal('hide');
            });
        };

        modal.onRender(function() {
            if (!PacketData) {
                modal.clearBody();

                var body = d3.select('#x-modal-body');
                var div  = body.append('div');

                div.attr({
                    class: 'alert alert-info',
                    role:  'alert',
                });
                div.append('span').attr({
                    class: 'glyphicon glyphicon-info-sign',
                });
                div.append('span')
                    .text(' Now loading packet data... please wait and retry.');

                return;
            }

            d3.json('/oftrace/switches/' + dpid, function(e, data) {
                modal.clearBody();
                createModal(data);
            });
        });

        modal.clearBody();
        modal.render();
    };

    var openTraceResultModal = function(data) {
        var modal = new layout.ModalManager([
            '<span class="glyphicon glyphicon-envelope"></span> ',
            'Traceroute Result > ' + data.number,
        ].join(''));

        var keys  = ['number', 'dpid', 'port', 'time'];
        var probe = util.splitString(data.data, 32);

        for (var i = 0; i < probe.length; i++) {
            var part = util.splitString(probe[i], 4).join(' ');
            var padd = (new Array(40 - part.length)).join(' ');

            probe[i] = [
                util.number2hexstr(i * 16, 4, true) + ':',
                part + padd,
                util.hexstr2string(probe[i]),
            ].join('  ');
        }

        modal.onRender(function() {
            modal.clearBody();

            var body  = d3.select('#x-modal-body');
            var tbody = body.append('table')
                .attr('class', 'table table-hover')
                .append('tbody');
            var tr = null;

            for (var i = 0; i < keys.length; i++) {
                tr = tbody.append('tr');
                tr.append('td').text(keys[i]);
                tr.append('td').text(data[keys[i]]);
            }

            tr = tbody.append('tr');
            tr.append('td').text('data');
            tr.append('td').append('pre').attr('class', 'pre-scrollable')
                .append('code').html(probe.join('<br/>'));
        });

        modal.clearBody();
        modal.render();
    };

    var main = function() {
        var svg = d3.select('#main').append('svg')
            .attr({
                id:     'svg',
                width:  750,
                height: 500,
            });

        var tpm = new topology.TopologyManager();
        var flm = new layout.ForceLayoutManager(svg, {
            href:   './ofs.svg',
            width:  50,
            height: 50,
        });

        var refresh = function() {
            flm.update(tpm.nodes, tpm.links, tpm.getPorts(),
                       tpm.getLinkTraceState());
        };

        var calculateCoordinate = function(data) {
            var link = tpm.links[data.linkIndex];

            if (!link) {
                return null;
            }

            if (data.linkDirection) {
                var sx = link.target.x;
                var sy = link.target.y;
                var dx = link.source.x - link.target.x;
                var dy = link.source.y - link.target.y;
            }
            else {
                var sx = link.source.x;
                var sy = link.source.y;
                var dx = link.target.x - link.source.x;
                var dy = link.target.y - link.source.y;
            }

            var r  = Math.atan2(dy, dx);
            var rx = Math.cos(r);
            var ry = Math.sin(r);

            return {
                start: {
                    x: sx,
                    y: sy,
                },
                delta: {
                    x: dx,
                    y: dy,
                },
                radian: {
                    x: rx,
                    y: ry,
                },
                r:  r,
            };
        };

        flm.onTick(function() {
            flm.links
                .attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

            flm.nodes.attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });

            flm.ports.attr('transform', function(d) {
                var coord = calculateCoordinate(d);

                if (!coord) {
                    return;
                }

                var x = coord.start.x + 20 * coord.radian.x;
                var y = coord.start.y + 20 * coord.radian.y;
                return 'translate(' + x + ',' + y + ')';
            });

            flm.traces.attr('transform', function(d) {
                var coord = calculateCoordinate(d);

                if (!coord) {
                    return;
                }

                var x = coord.start.x + 50 * coord.radian.x + 20;
                var y = coord.start.y + 50 * coord.radian.y;
                return 'translate(' + x + ',' + y + ')';
            });
        });

        flm.onDragStart(function(d) {
            var m = $('#menu');

            m.fadeOut(undefined, function() {
                m.html('');

                var menu = d3.select('#menu');

                menu.append('li')
                    .attr('class', 'nav-header')
                    .append('a')
                    .attr('class', 'glyphicon glyphicon-hdd')
                    .text(d.dpid);

                menu.append('li')
                    .append('a')
                    .attr('href', '#')
                    .text('Flow Entries')
                    .on('click', function() {
                        openFlowEntriesModal(d.dpid);
                    });

                menu.append('li')
                    .append('a')
                    .attr('href', '#')
                    .text('Traceroute')
                    .on('click', function() {
                        var count = 0;
                        var ptime = 0.0;

                        openTracerouteModal(
                            d.dpid,
                            function() {
                                tpm.clearLinkTraceState();
                                refresh();
                            },
                            function(params) {
                                var time = params[0].time;

                                tpm.setLinkTraceState({
                                    dpid:   params[0].dpid,
                                    port:   params[0].port,
                                    data:   params[0].data,
                                    loop:   params[0].loop,
                                    number: count++,
                                    time:   ptime ? time - ptime : 0,
                                });

                                ptime = time;
                                refresh();
                            });
                    });

                m.fadeIn();
            });
        });

        flm.onTraceMarkClick(function(d) {
            openTraceResultModal(d);
        });

        var wsurl = 'ws://' + location.host + '/v1.0/topology/ws';
        var ws    = new websocket.WebSocketManager(wsurl, {
            event_switch_enter: function(params) {
                var switches = [];

                for (var i = 0; i < params.length; i++) {
                    switches.push({
                        dpid:  params[i].dpid,
                        ports: params[i].ports,
                    });
                }

                tpm.addNodes(switches);
                refresh();
            },
            event_switch_leave: function(params) {
                var switches = [];

                for (var i = 0; i < params.length; i++) {
                    switches.push({
                        dpid:  params[i].dpid,
                        ports: params[i].ports,
                    });
                }

                tpm.removeNodes(switches);
                refresh();
            },
            event_link_add: function(params) {
                tpm.addLinks(params);
                refresh();
            },
            event_link_delete: function(params) {
                tpm.removeLinks(params);
                refresh();
            }
        });

        d3.select('#clear-button')
            .on('click', function() {
                tpm.clearLinkTraceState();
                refresh();
            });

        d3.json('./packet.json', function(e, data) {
            PacketData = data;
        });

        d3.json('/v1.0/topology/switches', function(e, data) {
            tpm.addNodes(data);

            d3.json('/v1.0/topology/links', function(e, data) {
                tpm.addLinks(data);

                refresh();
                ws.start();
            });
        });
    };

    return {
        main: main,
    };
})();
