# Makefile

# To compile
#   $ make build
# To deploy
#   $ make DOCKER_OPT="--network bobthe" NETWORK=fak
# To reset and deploy
#   $ make DOCKER_OPT="--network bobthe" RESET= NETWORK=fak

ifeq ($(shell uname -s), Linux)
    PASSWD_OPT=-u $(shell id -u):$(shell id -g) -v /etc/passwd:/etc/passwd:ro -v /etc/group:/etc/group:ro
    CURDIR_SOLC=$(shell pwd)
else
    CURDIR_SOLC=/tmp
endif

#DOCKER_OPT=--network bobthe
NODE14_IMAGE=node:14
DOCKER_RUN=docker run $(DOCKER_OPT) $(PASSWD_OPT) -it --rm -e "HOME=/tmp" -v $(shell pwd):/data -w /data $(NODE14_IMAGE)

ifdef NETWORK
DEST_NETWORK := --network $(NETWORK)
endif

ifdef RESET
DO_RESET=--reset
endif

.PHONY: build deploy

build: npm
	@$(DOCKER_RUN) nodejs node_modules/.bin/hardhat compile

npm:
	@[ -d node_modules/@openzeppelin/contracts ] || $(DOCKER_RUN) npm install @openzeppelin/contracts
	@[ -d node_modules/@openzeppelin/contracts-upgradeable ] || $(DOCKER_RUN) npm install @openzeppelin/contracts-upgradeable
	

deploy:
	$(DOCKER_RUN) nodejs node_modules/.bin/hardhat run scripts/deploy.js $(RESET) $(DEST_NETWORK)

gov: WemixGovernance.js

WemixGovernance.js: build/WemixGovernance.js

build/WemixGovernance.js: build_dir npm build/solc build/solc.sh build/gov.sol
	PATH=$(shell pwd)/build:$${PATH} build/solc.sh -r gov=$(CURDIR_SOLC)/contracts -r @openzeppelin=$(CURDIR_SOLC)/node_modules/@openzeppelin build/gov.sol $@

build/gov.sol:
	@if [ ! -f build/gov.sol ]; then \
		echo '// SPDX-License-Identifier: MIT' > $@; \
		echo 'pragma solidity ^0.8.0; import "gov/Gov.sol"; import "gov/GovChecker.sol"; import "gov/GovImp.sol"; import "gov/Registry.sol"; import "gov/storage/Staking.sol"; import "gov/StakingImp.sol"; import "gov/storage/BallotStorage.sol"; import "gov/storage/EnvStorage.sol"; import "gov/storage/EnvStorageImp.sol";' >> $@; \
	fi

build_dir:
	@[ -d build ] || mkdir -p build

SOLC_SH_URL=./solc.sh
build/solc.sh:
	 cp solc.sh build/solc.sh
	 chmod +x build/solc.sh

ifneq ($(shell uname), Linux)

build/solc:
	@test 1

else
SOLC_URL=https://github.com/ethereum/solidity/releases/download/v0.8.6/solc-static-linux
build/solc:
	@if [ ! -x build/solc ]; then				\
		if which curl > /dev/null 2>&1; then		\
			curl -Ls -o build/solc $(SOLC_URL);	\
			chmod +x build/solc;			\
		elif which wget > /dev/null 2>&1; then		\
			wget -nv -o build/solc $(SOLC_URL);	\
			chmod +x build/solc;			\
		fi						\
	fi

endif

clean:
	@[ -d build ] && rm -rf build

# EOF
