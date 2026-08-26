// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract enums {
    enum size {
        SMALL,
        MEDIUM,
        LARGE
    }
    size public choice;
    function setSmall() public {
        choice = size.SMALL;
    }
    function setMedium() public {
        choice = size.MEDIUM;
    }
    function setLarge() public {
        choice = size.LARGE;
    }
}

https://www.youtube.com/watch?v=7j0yotg35Ms&list=PLR0uCBk15bq96j_R_cS1Rwg96rfDAfCmM&index=18
