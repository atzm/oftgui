Introduction
============
oftgui is a Web frontend for `oftroute <https://github.com/atzm/oftroute>`_.
This provides graphical user interface for traceroute using topology detection
application built in `Ryu <http://osrg.github.io/ryu/>`_.

Usage
=====
oftgui provides just one command::

  $ oft-controller-gui

Using this command instead of oft-controller, it starts Web UI in addition to
RESTful APIs for traceroute service.  By default, it is provided on URL like::

  http://<ADDR>:8080/oftgui/index.html

Here <ADDR> is DNS hostname or IP address which oft-controller-gui runs on.

oft-controller-gui is a simple wrapper of ryu-manager.  It works fine without
any command-line arguments, but if you want to know about many command-line
arguments built in ryu-manager, you can see Ryu's documentation.

History
=======
0.0.1
  - First release

License
=======
oftgui itself is available under the Apache License Version 2.0.

Note that oftgui includes some JavaScript libraries, and they can be used under
each license.  Libraries which oftgui is using are in
`lib directory <https://github.com/atzm/oftgui/tree/master/oftgui/html/lib>`_.
