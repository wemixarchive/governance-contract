// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface INCPExit {

    function exit(
        address exitNcp,
        uint256 totalAmount,
        uint256 lockedUserBalanceToNCPTotal
    ) external payable;
}