# Makefile

# To compile
#   $ make build
# To deploy
#   $ make DOCKER_OPT="--network bobthe" NETWORK=fak
# To reset and deploy
#   $ make DOCKER_OPT="--network bobthe" RESET= NETWORK=fak

ifeq ($(shell uname -s), Linux)
    PASSWD_OPT=-u $(shell id -u):$(shell id -g) -v /etc/passwd:/etc/passwd:ro -v /etc/group:/etc/group:ro
endif

#DOCKER_OPT=--network bobthe
TRUFFLE_IMAGE=metadium/meta-web3:0.2
DOCKER_RUN=docker run $(DOCKER_OPT) $(PASSWD_OPT) -it --rm -e "HOME=/tmp" -v $(shell pwd):/data -w /data $(TRUFFLE_IMAGE)

ifdef NETWORK
DEST_NETWORK := --network $(NETWORK)
endif

ifdef RESET
DO_RESET=--reset
endif

.PHONY: build deploy

build: npm
	@$(DOCKER_RUN) nodejs node_modules/.bin/truffle compile

npm:
	@[ -f node_modules/.bin/truffle ] || $(DOCKER_RUN) npm install

deploy:
	$(DOCKER_RUN) nodejs node_modules/.bin/truffle migrate $(RESET) $(DEST_NETWORK)

gov: MetadiumGovernance.js

MetadiumGovernance.js: build/MetadiumGovernance.js

build/MetadiumGovernance.js: build_dir npm build/solc build/solc.sh build/gov.sol
	export DIR=${shell pwd}; cd build; \
	PATH=$${DIR}/build:$${PATH} $${DIR}/build/solc.sh -r gov=$${DIR}/contracts -r openzeppelin-solidity=$${DIR}/node_modules/openzeppelin-solidity gov.sol $${DIR}/$@

build/gov.sol:
	@if [ ! -f build/gov.sol ]; then \
		echo 'pragma solidity ^0.4.24; import "gov/Gov.sol"; import "gov/GovChecker.sol"; import "gov/GovImp.sol"; import "gov/Migrations.sol"; import "gov/Registry.sol"; import "gov/Staking.sol"; import "gov/storage/BallotStorage.sol"; import "gov/storage/EnvStorage.sol"; import "gov/storage/EnvStorageImp.sol";' > $@; \
	fi

build_dir:
	@[ -d build ] || mkdir -p build

SOLC_SH_URL=https://github.com/METADIUM/go-metadium/raw/master/metadium/scripts/solc.sh
build/solc.sh:
	@if [ ! -x build/solc.sh ]; then				\
		if which curl > /dev/null 2>&1; then			\
			curl -Ls -o build/solc.sh $(SOLC_SH_URL);	\
			chmod +x build/solc.sh;				\
		elif which wget > /dev/null 2>&1; then			\
			wget -nv -o build/solc.sh $(SOLC_SH_URL);	\
			chmod +x build/solc.sh;				\
		fi							\
	fi

ifneq ($(shell uname), Linux)

build/solc:
	@test 1

else
SOLC_URL=https://github.com/ethereum/solidity/releases/download/v0.4.24/solc-static-linux
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
