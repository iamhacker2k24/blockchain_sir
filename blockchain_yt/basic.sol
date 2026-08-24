// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract basic {
    bool public data = false;
    int length = -3;
    uint lenght = 2;
    string name = "dejd";
    bytes2 catagory = "go";
    function add() public view returns (uint) {
        return lenght; 
    }
     function global () public  view  returns  (uint){
          return  block.timestamp; //unix timestame converter  https://www.unixtimestamp.com/
     }
       function sender () public  view  returns  (address){
          return  msg.sender; //sender address
     }
     function balance () public  view  returns  (uint){
          return  msg.sender.balance; //sender balance https://eth-converter.com/
     }

}


contract varscope2 is basic { 
     function get2() public  view  returns (int){
           return length;
     }
}

// https://www.geeksforgeeks.org/solidity/storage-vs-memory-in-solidity/

// https://www.youtube.com/watch?v=zUWgF7A5_7c&list=PLR0uCBk15bq96j_R_cS1Rwg96rfDAfCmM&index=10



