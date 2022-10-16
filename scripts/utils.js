const DefaultBaseDerivationPath = "44'/60'/0'/0/0";
listLedgerDevices = async function () {
    var l = new Array();
    let transport = require("@ledgerhq/hw-transport-node-hid");
    let ledger = require("@ledgerhq/hw-app-eth");
    let lists = await transport.default.list();
    console.log("lists len", lists.length);
    for (var d of lists) {
        try {
            var t = await transport.default.open(d);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            addr2path[deviceAddr.address] = d;
            l.push({ addr: deviceAddr.address, path: d });
            console.log("close3");
            await t.close();
        } catch (e) {
            l.push({ addr: null, path: d });
        }
    }
    return l;
};

setLedgerSetting = async function () {
    var l = new Array();
    let transport = require("@ledgerhq/hw-transport-node-hid");
    let ledger = require("@ledgerhq/hw-app-eth");
    let lists = await transport.default.list();
    console.log("lists len", lists.length);
    for (var d of lists) {
        try {
            var t = await transport.default.open(d);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            addr2path[deviceAddr.address] = d;
            // l.push({ addr: deviceAddr.address, path: d });
            // console.log("close3");
            await t.close();
        } catch (e) {
            // l.push({ addr: null, path: d });
        }
    }
    // return l;
};
// address -> path cache
var addr2path = new Array();

loadLedgerByAddress = async function (addr, ethers) {
    addr = ethers.utils.getAddress(addr);
    let transport = require("@ledgerhq/hw-transport-node-hid");
    let ledger = require("@ledgerhq/hw-app-eth");

    // if it has a cached path, try it first
    if (addr in addr2path) {
        var path = addr2path[addr];
        var t = null;
        try {
            t = await transport.default.open(path);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            if (addr == ethers.utils.getAddress(deviceAddr.address)) {
                addr2path[addr] = d;
                return eth;
            }
        } catch (e) {
            // do nothing
        } finally {
            if (t != null) {
                console.log("close1");
                await t.close();
            }
        }
    }

    // scan the usb
    for (var d of await transport.default.list()) {
        var t = null;
        try {
            t = await transport.default.open(d);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            if (addr == ethers.utils.getAddress(deviceAddr.address)) {
                addr2path[addr] = d;
                return eth;
            }
        } catch (e) {
            continue;
        } finally {
            if (t != null) {
                console.log("close2");
                await t.close();
            }
        }
    }
    throw "not found";
};

ledgerSignAndClose = async function (from, tx, ethers) {
    addr = ethers.utils.getAddress(from);
    let transport = require("@ledgerhq/hw-transport-node-hid");
    let ledger = require("@ledgerhq/hw-app-eth");
    // var eth = null;
    // try {
    // let eth = await loadLedgerByAddress(from, ethers);
    // if it has a cached path, try it first
    if (addr in addr2path) {
        var path = addr2path[addr];
        var t = null;
        try {
            t = await transport.default.open(path);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            if (addr == ethers.utils.getAddress(deviceAddr.address)) {
                console.log("found from array")
                addr2path[addr] = d;
                return await sign(from, tx, ethers, eth);
            }
        } catch (e) {
            // do nothing
        } finally {
            if (t != null) {
                console.log("close4");
                await t.close();
            }
        }
    }

    // scan the usb
    for (var d of await transport.default.list()) {
        var t = null;
        try {
            t = await transport.default.open(d);
            var eth = new ledger.default(t);
            var deviceAddr = await eth.getAddress(DefaultBaseDerivationPath);
            if (addr == ethers.utils.getAddress(deviceAddr.address)) {
                addr2path[addr] = d;
                return await sign(from, tx, ethers, eth);
            }
        } catch (e) {
            continue;
        } finally {
            if (t != null) {
                console.log("close5");
                await t.close();
            }
        }
    }
    throw "not found";

    // console.log("close4");
    // await eth.transport.close();
    // eth = null;
    // return stx;
    // } catch (e) {
    //     console.log(e);
    //     throw e;
    // } finally {
    //     if (eth != null) {
    //         console.log("close5");
    //         await eth.transport.close();
    //     }
    // }
    // return null;
};

sign = async function (from, tx, ethers, eth) {
    // TODO: not tested
    baseTx = {
        type: tx.type || undefined,
        chainId: tx.chainId || undefined,
        data: tx.data || undefined,
        gasLimit: tx.gasLimit || undefined,
        nonce: tx.nonce ? ethers.BigNumber.from(tx.nonce).toNumber() : await ethers.provider.getTransactionCount(from),
        to: tx.to || undefined,
        value: tx.value || undefined,
    };
    if (baseTx.type == 2) {
        baseTx.gasPrice = tx.gasPrice || tx.maxFeePerGas || (await ethers.provider.getGasPrice());
        baseTx.maxFeePerGas = tx.maxFeePerGas || (await ethers.provider.getGasPrice());
        baseTx.maxPriorityFeePerGas = tx.maxPriorityFeePerGas || "100" + "0".repeat(9);
    } else {
        baseTx.gasPrice = tx.gasPrice || (await ethers.provider.getGasPrice());
    }
    // console.log(baseTx);
    var etx = ethers.utils.serializeTransaction(baseTx);
    const { ledgerService } = require("@ledgerhq/hw-app-eth");
    loadConfig = {};
    resolutionConfig = { externalPlugins: true, erc20: true };
    var resolution = await ledgerService.resolveTransaction(etx.substring(2), loadConfig, resolutionConfig);
    // console.log(etx);
    // var resolution = await ledgerService.resolveTransaction(etx.substr(2))
    var sig = await eth.signTransaction(DefaultBaseDerivationPath, etx.substr(2), resolution);
    var stx = ethers.utils.serializeTransaction(baseTx, { v: ethers.BigNumber.from("0x"+sig.v).toNumber(), r: ("0x"+sig.r), s: ("0x"+sig.s)})
    return stx;
};

// try forever
ledgerSignAndCloseEx = async function (from, tx) {
    var oe = null;
    while (true) {
        try {
            return await ledgerSignAndClose(from, tx);
        } catch (e) {
            if (e.message != oe) {
                oe = e.message;
                console.log(e);
            }
        }
        delay(100);
    }
};

function largeToString(num) {
    return num.toLocaleString("fullwid", { useGrouping: false });
}

module.exports = { largeToString, listLedgerDevices, loadLedgerByAddress, ledgerSignAndClose, ledgerSignAndCloseEx, addr2path, setLedgerSetting };
