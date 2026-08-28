// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract mappings {
    mapping(address => uint) public balances;
    function setBalance(uint bal) public {
        balances[msg.sender] = bal;
    }
}
