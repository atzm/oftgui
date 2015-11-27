# -*- coding: utf-8 -*-

import os

import webob.static

import ryu.base
import ryu.app.wsgi


class Application(ryu.base.app_manager.RyuApp):
    _CONTEXTS = {
        'wsgi': ryu.app.wsgi.WSGIApplication,
    }

    def __init__(self, *args, **kwargs):
        super(Application, self).__init__(*args, **kwargs)
        kwargs['wsgi'].register(Controller)


class Controller(ryu.app.wsgi.ControllerBase):
    def __init__(self, req, link, data, **config):
        super(Controller, self).__init__(req, link, data, **config)
        self.path = '%s/html/' % os.path.dirname(__file__)
        self.app = webob.static.DirectoryApp(self.path)

    @ryu.app.wsgi.route('oftgui', '/oftgui/{file:.*}')
    def handle_static(self, req, **kwargs):
        if kwargs['file']:
            req.path_info = kwargs['file']
        return self.app(req)


ryu.base.app_manager.require_app('oftrace.flow')
ryu.base.app_manager.require_app('oftrace.trace')
ryu.base.app_manager.require_app('ryu.app.rest_topology')
ryu.base.app_manager.require_app('ryu.app.ws_topology')
