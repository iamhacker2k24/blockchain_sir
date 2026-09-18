// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CampaignFactory
 * @dev Factory contract that deploys and keeps track of individual crowdfunding campaigns.
 * Each user can create their own campaign with target amount, image, story, and category.
 */
contract CampaignFactory {
    // Array storing addresses of all deployed campaign contracts
    address[] public deployedCampaigns;

    // Event emitted whenever a new campaign is successfully created.
    // Frontend listeners and block explorers can track this event.
    event CampaignCreated(
        string title,
        uint256 requiredAmount,
        address indexed owner,
        address campaignAddress,
        string imgURI,
        uint256 indexed timestamp,
        string indexed category
    );

    /**
     * @notice Creates a new Campaign contract and stores its address.
     * @param campaignTitle The name or title of the fundraiser
     * @param requiredCampaignAmount The fundraising goal (in wei)
     * @param imgURI The IPFS CID or URL for the campaign banner image
     * @param storyURI The IPFS CID or text containing the campaign story
     * @param category The category (e.g., medical, education, charity, etc.)
     * @return The address of the newly deployed Campaign contract
     */
    function createCampaign(
        string memory campaignTitle,
        uint256 requiredCampaignAmount,
        string memory imgURI,
        string memory storyURI,
        string memory category
    ) public returns (address) {
        // IMPORTANT: We pass payable(msg.sender) so the Campaign contract knows
        // who created it. If we don't pass msg.sender, the owner would default to
        // the Factory contract address, trapping all donated funds!
        Campaign newCampaign = new Campaign(
            campaignTitle,
            requiredCampaignAmount,
            imgURI,
            storyURI,
            category,
            payable(msg.sender)
        );

        address campaignAddress = address(newCampaign);
        deployedCampaigns.push(campaignAddress);

        // Emit the event with campaign details
        emit CampaignCreated(
            campaignTitle,
            requiredCampaignAmount,
            msg.sender,
            campaignAddress,
            imgURI,
            block.timestamp,
            category
        );

        return campaignAddress;
    }

    /**
     * @notice Returns a list of all deployed campaign contract addresses.
     * This allows the frontend to fetch all campaigns without hitting public RPC log limits.
     */
    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }

    // --- Backwards compatibility aliases for older tutorial naming ---
    function deployedcampaigns(uint256 index) public view returns (address) {
        return deployedCampaigns[index];
    }

    function createcampain(
        string memory campaignTitle,
        uint256 requireCamapinAmount,
        string memory imguRI,
        string memory storyURI,
        string memory category
    ) public returns (address) {
        return createCampaign(campaignTitle, requireCamapinAmount, imguRI, storyURI, category);
    }
}

// Alias contract name so older scripts referring to "Campinfactory" still work seamlessly
contract Campinfactory is CampaignFactory {}

/**
 * @title Campaign
 * @dev An individual campaign that holds state and receives donations.
 */
contract Campaign {
    // Campaign metadata
    string public title;
    uint256 public requiredAmount; // Goal amount in wei
    string public image;           // IPFS CID or URL
    string public story;           // IPFS CID or story description
    string public category;        // Campaign category
    address payable public owner;  // Creator who receives the donations
    uint256 public receivedAmount; // Total amount raised in wei

    // Donation record struct
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    // List of all donations made to this campaign
    Donation[] public donations;

    // Event emitted when a donation is made
    event Donated(
        address indexed donor,
        uint256 indexed amount,
        uint256 indexed timestamp
    );

    /**
     * @dev Constructor called by CampaignFactory
     */
    constructor(
        string memory _title,
        uint256 _requiredAmount,
        string memory _image,
        string memory _story,
        string memory _category,
        address payable _owner
    ) {
        title = _title;
        requiredAmount = _requiredAmount;
        image = _image;
        story = _story;
        category = _category;
        owner = _owner; // Correctly sets the user's wallet as owner
        receivedAmount = 0;
    }

    /**
     * @notice Allows anyone to donate native cryptocurrency (ETH/POL) to this campaign.
     * The donated funds are immediately forwarded to the campaign owner's wallet.
     */
    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        require(requiredAmount > receivedAmount, "Target amount already fulfilled");

        // Forward the donated funds directly to the campaign creator
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Transfer to campaign owner failed");

        // Update total raised amount
        receivedAmount += msg.value;

        // Record the donation in memory/storage
        donations.push(Donation(msg.sender, msg.value, block.timestamp));

        // Emit donation event
        emit Donated(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Returns all donation records for this campaign.
     */
    function getDonations() public view returns (Donation[] memory) {
        return donations;
    }

    /**
     * @notice Helper function returning all essential campaign information in one call.
     * This avoids multiple RPC requests from the frontend.
     */
    function getCampaignSummary()
        public
        view
        returns (
            string memory _title,
            uint256 _requiredAmount,
            uint256 _receivedAmount,
            string memory _image,
            string memory _story,
            string memory _category,
            address _owner,
            uint256 _donationsCount
        )
    {
        return (
            title,
            requiredAmount,
            receivedAmount,
            image,
            story,
            category,
            owner,
            donations.length
        );
    }

    // --- Backwards compatibility aliases for older tutorial spelling ---
    function tittle() public view returns (string memory) { return title; }
    function requireedAmouut() public view returns (uint256) { return requiredAmount; }
    function recivedAmout() public view returns (uint256) { return receivedAmount; }
}

