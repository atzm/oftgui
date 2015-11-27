#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages


setup(
    name='oftgui',
    version='0.0.1',
    description='OpenFlow traceroute GUI',
    author='Atzm WATANABE',
    author_email='atzm@atzm.org',
    entry_points={'console_scripts': [
        'oft-controller-gui = oftgui.cmd.gui:main',
    ]},
    packages=find_packages(exclude=['test']),
    include_package_data=True,
    install_requires=[
        'setuptools-git',
        'ryu>=3.26',
        'oftrace',
    ],
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2.7',
    ],
)
