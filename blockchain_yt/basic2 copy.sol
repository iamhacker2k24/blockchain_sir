// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Structs {

    struct Student {
        string name;
        uint age;
    }

    Student[] public allstudents;

    function getStudent(string memory _name, uint _age) public {
        Student memory newstudent = Student({
            name: _name,
            age: _age
        });

        allstudents.push(newstudent);
    }
}