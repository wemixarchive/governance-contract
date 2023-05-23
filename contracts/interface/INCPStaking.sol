// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @author @seunghwalee
interface INCPStaking {
    function ncpDeposit(
        uint256 amount,
        address payable to,
        bool claimReward
    ) external payable;
}
