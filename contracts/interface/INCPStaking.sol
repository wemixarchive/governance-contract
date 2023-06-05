// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @author @seunghwalee
interface INCPStaking {
    function ncpDeposit(
        uint256 amount,
        address payable to
    ) external payable;
    function ncpWithdraw(
        uint256 amount,
        address payable to
    ) external payable;
}
