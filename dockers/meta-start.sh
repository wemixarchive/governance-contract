#!/bin/bash

HOST_IP=$(/sbin/ip route | awk '/default via/ { print $3 }')
export HOST_IP
export NODE_PATH=/root/node_modules

case "$1" in
"build-image")
    docker build -t metadium/meta-web3:0.2 .
    ;;
"truffle")
    shift
    exec /usr/bin/nodejs /data/node_modules/.bin/truffle $*
    ;;
"npm")
    shift
    exec /usr/bin/npm $*
    ;;
"nodejs")
    shift
    exec /usr/bin/nodejs $*
    ;;
*)
    shift
    exec /bin/bash $*
    ;;
esac

# EOF
