# -*- coding: utf-8 -*-

import sys

import ryu.cmd.manager


def main():
    sys.argv.append('oftgui.server')
    sys.argv.append('--install-lldp-flow')
    sys.argv.append('--observe-links')
    ryu.cmd.manager.main()


if __name__ == '__main__':
    main()
