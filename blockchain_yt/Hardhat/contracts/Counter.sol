// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

contract Counter {
  uint public x;

  event Increment(uint by);

  function inc() public {
    x++;
    emit Increment(1);
  }

  function incBy(uint by) public {
    require(by > 0, "incBy: increment should be positive");
    x += by;
    emit Increment(by);
  }
}

//// https://www.youtube.com/watch?v=0ZwOjQeWtAQ&list=PLR0uCBk15bq96j_R_cS1Rwg96rfDAfCmM&index=37