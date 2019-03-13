const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');

const Registry = artifacts.require('Registry.sol');
const Staking = artifacts.require('Staking.sol');

contract('Registry', function ([deployer, admin, user]) {
  let registry, staking;

  beforeEach(async () => {
    registry = await Registry.new();
    staking = await Staking.new(registry.address,"");
  });

  describe('Owner ', function () {
    it('can set Contract Domain', async () => {
      await registry.setContractDomain('Staking', staking.address);
      const domain = await registry.getContractAddress('Staking');
      assert.equal(domain, staking.address);
    });

    it('can set permission', async () => {
      await registry.setPermission('Staking', admin, 'true');
      const permitted = await registry.getPermission('Staking', admin);
      assert.equal(permitted, true);
    });
  });

  describe('Other users ', function () {
    it('cannot set Contract Domain', async () => {
      await reverting(registry.setContractDomain('Staking', staking.address, { from: user }));
    });

    it('cannot set permission', async () => {
      await reverting(registry.setPermission('Staking', user, 'true', { from: user }));
    });
  });
});
