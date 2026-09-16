// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Campinfactory {
    address[] public deployedcampaigns;
    event campainCreate(
        string title,
        uint requireAmount,
        address indexed owner,
        address campaignAddress,
        string imgURI,
        uint indexed timestamp, // we ca use index only three times 
        string indexed category
    );
    function createcampain(
        string memory campaignTitle,
        uint requireCamapinAmount,
        string memory imguRI,
        string memory storyURI,
         string memory category
    ) public {
        Campaign newCampign = new Campaign(
            campaignTitle,
            requireCamapinAmount,
            imguRI,
            storyURI
        );
        deployedcampaigns.push(address(newCampign));
        emit campainCreate(
            campaignTitle,
            requireCamapinAmount,
            msg.sender,
            address(newCampign),
            imguRI,
            block.timestamp,
            category
            
        );
    }
}
contract Campaign {
    string public tittle = "campaign test";
    uint public requireedAmouut;
    string public image;
    string public story;
    address payable public owner;
    uint public recivedAmout;
    event donated(
        address indexed donar,
        uint indexed amount,
        uint indexed timestamp
    );

    constructor(
        string memory campaingntittle,
        uint requireedcampainAmouut,
        string memory imgURI,
        string memory stoyURI
    ) {
        tittle = campaingntittle;
        requireedAmouut = requireedcampainAmouut;
        image = imgURI;
        story = stoyURI;
        owner = payable(msg.sender);
    }

    function donate() public payable {
        require(requireedAmouut > recivedAmout, "requireedAmouut fullfilled");
        // owner.transfer(msg.value);
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Transfer failed");
        recivedAmout += msg.value;
        emit donated(msg.sender, msg.value, block.timestamp);
    }
}
