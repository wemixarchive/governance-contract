// perm-test.js

var reg, gov, staking, ballotStorage;

function perm_param(from) {
  return { from: from == null ? eth.accounts[0] : from, gas: 10000000 }
}

function check_receipt(tx) {
  var count = 300, interval = 100
  for (var i = 0; i < count; i++ ) {
    var r = eth.getTransactionReceipt(tx)
    if (r != null)
      return web3.toBigNumber(r.status) == 1
    msleep(interval)
  }
  throw "Cannot get a transaction receipt for " + tx
}

// returns Registry
function find_gov(ix) {
  var lix = eth.blockNumber
  if (ix < 0) {
    ix = lix + ix;
  }
  for (var i = lix; i >= ix; i--) {
    var b = eth.getBlock(i);
    if (b.transactions.length == 0)
      continue
    for (var j = 0; j < b.transactions.length; j++) {
      var t = eth.getTransactionReceipt(b.transactions[j]);
      // check if it's contract creation
      if (t.contractAddress == null)
        continue
      var reg = Registry_load(t.contractAddress);
      if (web3.toAscii(web3.toHex(reg.magic())) == "Metadium Registry")
        return reg;
    }
  }
  return null;
}

function perm_test_init() {
  reg = find_gov(-1000);
  if (reg != null) {
    gov = web3.eth.contract(GovImp_contract.abi).at(reg.getContractAddress("GovernanceContract"))
    staking = Staking_load(reg.getContractAddress("Staking"))
    ballotStorage = Staking_load(reg.getContractAddress("BallotStorage"))
  }
}

function perm_test_vote_2(tx, acct1, acct2) {
  check_receipt(tx)
  var vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(acct1))
  var tx2 = gov.vote(vid, true, perm_param(acct2))
  check_receipt(tx2)
}

function perm_test_init_groups() {
  var g1 = 100, g2 = 101
  var vid, tx;

  tx = gov.addProposalToAddPermissionGroup(g1, 1, perm_param(eth.accounts[0]))
  perm_test_vote_2(tx, eth.accounts[1], eth.accounts[2])

  tx = gov.addProposalToAddPermissionGroup(g2, 1, perm_param(eth.accounts[0]))
  perm_test_vote_2(tx, eth.accounts[1], eth.accounts[2])

  tx = gov.addProposalToRemovePermissionGroup(g1, perm_param(eth.accounts[0]))
  perm_test_vote_2(tx, eth.accounts[1], eth.accounts[2])

  tx = gov.addProposalToAddPermissionGroup(g1, 1, perm_param(eth.accounts[0]))
  perm_test_vote_2(tx, eth.accounts[1], eth.accounts[2])

  tx = gov.addProposalToChangePermissionGroup(g2, 0, perm_param(eth.accounts[0]))
  perm_test_vote_2(tx, eth.accounts[1], eth.accounts[2])
}

function perm_test_init_accounts() {
  var vid, addr1 = eth.accounts[3], addr2 = eth.accounts[4];

  vid = web3.toDecimal(gov.ballotLength()) + 1
  gov.addProposalToAddPermissionAccount(addr1, 100, perm_param(eth.accounts[0]))
  gov.vote(vid, true, perm_param(eth.accounts[1]));
  gov.vote(vid, true, perm_param(eth.accounts[2]));
  admin.sleep(1.0)

  vid = web3.toDecimal(gov.ballotLength()) + 1
  gov.addProposalToAddPermissionAccount(addr2, 101, perm_param(eth.accounts[0]))
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  gov.vote(vid, true, perm_param(eth.accounts[2]));
  admin.sleep(1.0)

  vid = web3.toDecimal(gov.ballotLength()) + 1
  gov.addProposalToRemovePermissionAccount(addr1, perm_param(eth.accounts[0]))
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  gov.vote(vid, true, perm_param(eth.accounts[2]))
  admin.sleep(1.0)

  vid = web3.toDecimal(gov.ballotLength()) + 1
  gov.addProposalToAddPermissionAccount(addr1, 101, perm_param(eth.accounts[0]))
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  gov.vote(vid, true, perm_param(eth.accounts[2]))
  admin.sleep(1.0)

  vid = web3.toDecimal(gov.ballotLength()) + 1
  gov.addProposalToChangePermissionAccount(addr2, 100, perm_param(eth.accounts[0]))
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  gov.vote(vid, true, perm_param(eth.accounts[2]))
  admin.sleep(1.0)
}

function perm_test_init_nodes() {
  var n1 = "0xe3693591cf9cb3dd3af0da665f31d59b47335c00770bc76c930fc7cfa3f3771c094c5b94fba4784d8229c8ecf23ab4e4fdec269145b0a52da3bae3cdfe75b171"
  var n2 = "0xd90e1d46b1118fae52b6b1fb6f83a51846f22cfa639b4ba441002f68d8798abc79b19ce13868b5998a75715a8c2abc9d34594733be59961e5a2a79a42391b430"
  var vid, tx;

  tx = gov.addProposalToAddPermissionNode(n1, 1, perm_param(eth.accounts[0]))
  check_receipt(tx)
  vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  tx = gov.vote(vid, true, perm_param(eth.accounts[2]))
  check_receipt(tx)

  tx = gov.addProposalToAddPermissionNode(n2, 1, perm_param(eth.accounts[0]))
  check_receipt(tx)
  vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  tx = gov.vote(vid, true, perm_param(eth.accounts[2]))
  check_receipt(tx)

  tx = gov.addProposalToRemovePermissionNode(n1, perm_param(eth.accounts[0]))
  check_receipt(tx)
  vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  tx = gov.vote(vid, true, perm_param(eth.accounts[2]))
  check_receipt(tx)

  tx = gov.addProposalToAddPermissionNode(n1, 1, perm_param(eth.accounts[0]))
  check_receipt(tx)
  vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  tx = gov.vote(vid, true, perm_param(eth.accounts[2]))
  check_receipt(tx)

  tx = gov.addProposalToChangePermissionNode(n2, 0, perm_param(eth.accounts[0]))
  check_receipt(tx)
  vid = gov.ballotLength()
  gov.vote(vid, true, perm_param(eth.accounts[1]))
  tx = gov.vote(vid, true, perm_param(eth.accounts[2]))
  check_receipt(tx)
}

// EOF
