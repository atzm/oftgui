#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from setuptools import setup, find_packages

longdesc = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()

setup(
    name='oftgui',
    version='0.0.1',
    description='OpenFlow traceroute GUI',
    long_description=longdesc,
    author='Atzm WATANABE',
    author_email='atzm@atzm.org',
    url='https://github.com/atzm/oftgui',
    license='Apache-2.0',
    entry_points={'console_scripts': [
        'oft-controller-gui = oftgui.cmd.gui:main',
    ]},
    packages=find_packages(exclude=['test']),
    include_package_data=True,
    install_requires=[
        'setuptools-git',
        'ryu>=3.26',
        'oftroute',
    ],
    keywords=['network', 'ryu', 'openflow', 'traceroute'],
    classifiers=[
        'License :: OSI Approved :: Apache Software License',
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2.7',
        'Topic :: System :: Networking',
    ],
)
