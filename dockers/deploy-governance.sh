#!/bin/bash

if [ 0 = 1 -a "$(uname -s)" = "Linux" ]; then
    PASSWD_OPT="-u $(id -u):$(id -g) -v /etc/passwd:/etc/passwd:ro -v /etc/group:/etc/group:ro"
fi

DEPOT=https://github.com/metadium/governance-contract
TRUFFLE_IMAGE=metadium/meta-web3:0.2
DOCKER_RUN="docker run ${DOCKER_OPT} ${PASSWD_OPT} -it --rm -e \"HOME=/tmp\" -v $PWD:/data -w /data ${TRUFFLE_IMAGE}" 

function die () { echo $*; exit 1; }

function setup ()
{
    cd /data
    if [ ! -d governance-contract -a ! -f governance-contract/.git/config ]; then
        git clone $DEPOT || die "cannot clone $DEPOT";
    fi
    HAS_NODE_MODULES=
    if [ -f "$1" ]; then
        tar -C governance-contract -xzf "$1";
        HAS_NODE_MODULES=1
    fi  
    cd governance-contract;
    [ "$HAS_NODE_MODULES" = 1 ] || npm install
    nodejs node_modules/.bin/truffle compile
}

function deploy ()
{
    [ -d /data/governance-contract ] || die "cannot find depot"
    cd /data/governance-contract
    nodejs node_modules/.bin/truffle migrate --network "$1"
}

function usage ()
{
    echo "Usage: `basename $0` [archive <tar-name> <dir> | setup [<tar-name>] |
	deploy <network-name>]";
}

# it begins...

case "$1" in
archive)
    if [ $# -lt 3 ]; then
        usage;
        exit 1;
    fi
    if [ -d "$2/node_modules" ]; then 
        echo "Cannot find $2/node_modules directory";
        exit 1;
    fi
    tar -C $3 -czf $2 node_modules;
    ;;
setup)
    cat /proc/1/cgroup 2> /dev/null | grep -q docker;
    if [ $? != 0 ]; then
        docker --help > /dev/null 2>&1 || die "Cannot find docker"
    fi
    ${DOCKER_RUN} bash ./`basename $0` setup-inner $2
    ;;
setup-inner)
    setup $2
    ;;
deploy)
    cat /proc/1/cgroup 2> /dev/null | grep -q docker;
    if [ $? != 0 ]; then
        docker --help > /dev/null 2>&1 || die "Cannot find docker"
    fi
    [ $# -lt 2 ] && (usage; exit 1);
    ${DOCKER_RUN} bash ./`basename $0` deploy-inner $2
    ;;
deploy-inner)
    [ $# -lt 2 ] && (usage; exit 1);
    deploy $2
    ;;
*)
    usage
    ;;
esac

# EOF
