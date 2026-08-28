// SPDX-License-Identifier: MIT
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";


pragma solidity ^0.8.20;


contract hash {
    bytes32 public password;
    function generatePass(string memory _pass) public pure  returns (bytes32) {
return  keccak256((abi.encodePacked(_pass)));
         
    }
}

