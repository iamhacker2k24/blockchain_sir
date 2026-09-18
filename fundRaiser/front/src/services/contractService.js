import { ethers } from "ethers";
import contractConfig from "../contracts/contractConfig.json";

/**
 * ============================================================================
 * CONTRACT SERVICE (ETHERS V6)
 * ============================================================================
 * 
 * Provides clean helper functions to interact with the CampaignFactory and
 * individual Campaign smart contracts.
 */

// IPFS Gateway configuration
export const IPFS_GATEWAY = "https://plum-bizarre-tiger-67.mypinata.cloud/ipfs/";
export const FALLBACK_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Converts an IPFS CID or URL into an accessible HTTP URL
 */
export const getIpfsUrl = (cidOrUrl) => {
  if (!cidOrUrl) return "/placeholder.jpg";
  if (cidOrUrl.startsWith("http://") || cidOrUrl.startsWith("https://")) {
    return cidOrUrl;
  }
  // Remove ipfs:// prefix if present
  const cleanCid = cidOrUrl.replace("ipfs://", "");
  return `${IPFS_GATEWAY}${cleanCid}`;
};

/**
 * Gets a reliable provider for reading blockchain data.
 * Falls back to localhost or public testnet RPC if wallet is disconnected or on wrong chain.
 */
export const getReadProvider = (signerOrProvider) => {
  if (signerOrProvider) {
    return signerOrProvider;
  }
  if (contractConfig.chainId === 31337) {
    return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  }
  return new ethers.JsonRpcProvider(
    "https://rpc-amoy.polygon.technology/"
  );
};

/**
 * Gets an active CampaignFactory contract instance
 */
export const getFactoryContract = (signerOrProvider) => {
  const activeAddress = contractConfig.factoryAddress || localStorage.getItem("FUNDRAISER_FACTORY_ADDRESS");
  if (!activeAddress) {
    throw new Error("CampaignFactory contract address not configured. Please deploy the contract first.");
  }
  const provider = getReadProvider(signerOrProvider);
  return new ethers.Contract(activeAddress, contractConfig.factoryAbi, provider);
};

/**
 * Gets an active Campaign contract instance for a specific campaign address
 */
export const getCampaignContract = (campaignAddress, signerOrProvider) => {
  if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
    throw new Error(`Invalid campaign contract address: ${campaignAddress}`);
  }
  const provider = getReadProvider(signerOrProvider);
  return new ethers.Contract(campaignAddress, contractConfig.campaignAbi, provider);
};

/**
 * Fetches all deployed campaigns and their details
 */
export const fetchAllCampaigns = async (providerOrSigner) => {
  try {
    const activeAddress = contractConfig.factoryAddress || localStorage.getItem("FUNDRAISER_FACTORY_ADDRESS");
    if (!activeAddress) return [];

    let activeProvider = getReadProvider(providerOrSigner);

    // Verify if bytecode exists at address on this provider
    try {
      const code = await activeProvider.getCode(activeAddress);
      if (code === "0x" || code === "0x0") {
        // If MetaMask is on another chain (e.g. Amoy while contract is on Localhost),
        // fallback to the default provider where the contract actually lives!
        if (contractConfig.chainId === 31337) {
          activeProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        } else {
          activeProvider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
        }
      }
    } catch (codeErr) {
      console.warn("Could not check contract bytecode:", codeErr.message);
    }

    const factory = new ethers.Contract(activeAddress, contractConfig.factoryAbi, activeProvider);
    
    // 1. Get array of all deployed campaign addresses
    const deployedAddresses = await factory.getDeployedCampaigns();
    console.log(`Found ${deployedAddresses.length} deployed campaigns`);

    if (!deployedAddresses || deployedAddresses.length === 0) {
      return [];
    }

    // 2. Fetch details for each campaign concurrently using Promise.all
    const campaigns = await Promise.all(
      deployedAddresses.map(async (address) => {
        try {
          const campaignContract = new ethers.Contract(address, contractConfig.campaignAbi, activeProvider);
          
          // Use getCampaignSummary() if available, or fall back to individual getters
          let title, requiredAmount, receivedAmount, image, story, category, owner, donationsCount;

          try {
            const summary = await campaignContract.getCampaignSummary();
            title = summary._title;
            requiredAmount = summary._requiredAmount;
            receivedAmount = summary._receivedAmount;
            image = summary._image;
            story = summary._story;
            category = summary._category;
            owner = summary._owner;
            donationsCount = Number(summary._donationsCount);
          } catch (e) {
            // Fallback to individual public state variables
            title = await campaignContract.title();
            requiredAmount = await campaignContract.requiredAmount();
            receivedAmount = await campaignContract.receivedAmount();
            image = await campaignContract.image();
            story = await campaignContract.story();
            category = await campaignContract.category();
            owner = await campaignContract.owner();
            donationsCount = 0;
          }

          const requiredEth = ethers.formatEther(requiredAmount);
          const receivedEth = ethers.formatEther(receivedAmount);
          const percentage = requiredAmount > 0n 
            ? Number((receivedAmount * 100n) / requiredAmount) 
            : 0;

          return {
            address,
            title,
            requiredAmount: requiredEth,
            receivedAmount: receivedEth,
            percentage: Math.min(percentage, 100),
            image,
            story,
            category: category || "Other",
            owner,
            donationsCount,
          };
        } catch (err) {
          console.error(`Failed to fetch details for campaign at ${address}:`, err);
          return null;
        }
      })
    );

    // Filter out any failed reads and return newest first
    return campaigns.filter(Boolean).reverse();
  } catch (error) {
    console.error("Error in fetchAllCampaigns:", error);
    throw error;
  }
};

/**
 * Fetches detailed info for a single campaign, including its donations history
 */
export const fetchCampaignDetails = async (campaignAddress, providerOrSigner) => {
  try {
    const campaignContract = getCampaignContract(campaignAddress, providerOrSigner);
    
    const summary = await campaignContract.getCampaignSummary();
    const rawDonations = await campaignContract.getDonations();

    const donations = rawDonations.map((d) => ({
      donor: d.donor,
      amount: ethers.formatEther(d.amount),
      timestamp: Number(d.timestamp),
      date: new Date(Number(d.timestamp) * 1000).toLocaleString(),
    }));

    const requiredEth = ethers.formatEther(summary._requiredAmount);
    const receivedEth = ethers.formatEther(summary._receivedAmount);
    const percentage = summary._requiredAmount > 0n 
      ? Number((summary._receivedAmount * 100n) / summary._requiredAmount) 
      : 0;

    return {
      address: campaignAddress,
      title: summary._title,
      requiredAmount: requiredEth,
      receivedAmount: receivedEth,
      percentage: Math.min(percentage, 100),
      image: summary._image,
      story: summary._story,
      category: summary._category || "Other",
      owner: summary._owner,
      donationsCount: Number(summary._donationsCount),
      donations: donations.reverse(), // Newest donations first
    };
  } catch (error) {
    console.error(`Error fetching campaign details for ${campaignAddress}:`, error);
    throw error;
  }
};

/**
 * Creates a new campaign on-chain via the CampaignFactory
 */
export const createCampaignOnChain = async ({
  title,
  requiredAmountEth,
  imageCid,
  storyCid,
  category,
  signer,
}) => {
  if (!signer) throw new Error("Wallet not connected. Please connect MetaMask.");
  if (!title) throw new Error("Campaign title is required.");
  if (!requiredAmountEth || Number(requiredAmountEth) <= 0) {
    throw new Error("Required amount must be greater than 0.");
  }

  const factory = getFactoryContract(signer);
  
  // Convert ETH / POL to wei
  const amountInWei = ethers.parseEther(requiredAmountEth.toString());

  console.log("Calling factory.createCampaign with:", {
    title,
    amountInWei: amountInWei.toString(),
    imageCid,
    storyCid,
    category,
  });

  // Send transaction
  const tx = await factory.createCampaign(
    title,
    amountInWei,
    imageCid || "",
    storyCid || "",
    category || "Other"
  );

  console.log("Transaction submitted, hash:", tx.hash);

  // Wait for 1 confirmation
  const receipt = await tx.wait(1);
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  return {
    txHash: tx.hash,
    receipt,
  };
};

/**
 * Donates native cryptocurrency (POL / ETH) to a specific campaign
 */
export const donateToCampaign = async ({ campaignAddress, amountEth, signer }) => {
  if (!signer) throw new Error("Wallet not connected. Please connect MetaMask.");
  if (!amountEth || Number(amountEth) <= 0) {
    throw new Error("Please enter a donation amount greater than 0.");
  }

  const campaign = getCampaignContract(campaignAddress, signer);
  const donationWei = ethers.parseEther(amountEth.toString());

  console.log(`Donating ${amountEth} tokens (${donationWei.toString()} wei) to ${campaignAddress}`);

  const tx = await campaign.donate({ value: donationWei });
  console.log("Donation transaction submitted, hash:", tx.hash);

  const receipt = await tx.wait(1);
  console.log("Donation confirmed!");

  return {
    txHash: tx.hash,
    receipt,
  };
};
