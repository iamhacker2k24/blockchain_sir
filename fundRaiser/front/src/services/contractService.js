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
 * Gets the active factory contract address from localStorage override or contractConfig
 */
export const getActiveFactoryAddress = () => {
  return (
    localStorage.getItem("FUNDRAISER_FACTORY_ADDRESS") ||
    contractConfig.factoryAddress ||
    ""
  );
};

/**
 * Returns default RPC URL for a given chainId
 */
export const getDefaultRpcUrl = (chainId = contractConfig.chainId) => {
  if (Number(chainId) === 31337) {
    return "http://127.0.0.1:8545";
  }
  if (Number(chainId) === 11155111) {
    return "https://ethereum-sepolia-rpc.publicnode.com";
  }
  return "https://rpc-amoy.polygon.technology/";
};

/**
 * Checks whether an address has smart contract bytecode deployed on the given provider
 */
export const checkContractDeployment = async (address, provider) => {
  if (!address || !ethers.isAddress(address) || !provider) {
    return { isDeployed: false, code: "0x", network: null };
  }
  try {
    const [code, network] = await Promise.all([
      provider.getCode(address).catch(() => "0x"),
      provider.getNetwork().catch(() => null),
    ]);
    const isDeployed = Boolean(code && code !== "0x" && code !== "0x0");
    return { isDeployed, code, network };
  } catch (err) {
    console.warn("checkContractDeployment error:", err.message);
    return { isDeployed: false, code: "0x", network: null };
  }
};

/**
 * Gets a reliable provider for reading blockchain data.
 * Falls back to localhost or public testnet RPC if wallet is disconnected or on wrong chain.
 */
export const getReadProvider = (signerOrProvider) => {
  if (signerOrProvider) {
    return signerOrProvider;
  }
  return new ethers.JsonRpcProvider(getDefaultRpcUrl(contractConfig.chainId));
};

/**
 * Gets an active CampaignFactory contract instance
 */
export const getFactoryContract = (signerOrProvider) => {
  const activeAddress = getActiveFactoryAddress();
  if (!activeAddress || !ethers.isAddress(activeAddress)) {
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
 * Resolves the best provider and factory contract instance that actually has bytecode deployed
 */
export const resolveWorkingFactory = async (providerOrSigner) => {
  const activeAddress = getActiveFactoryAddress();
  if (!activeAddress || !ethers.isAddress(activeAddress)) {
    return { factory: null, activeProvider: null, activeAddress: null, error: "Contract address not configured" };
  }

  // 1. First test the provided provider (e.g. MetaMask or custom)
  let activeProvider = providerOrSigner ? getReadProvider(providerOrSigner) : null;
  let deployed = false;

  if (activeProvider) {
    const status = await checkContractDeployment(activeAddress, activeProvider);
    if (status.isDeployed) {
      deployed = true;
    }
  }

  // 2. If not deployed on current provider, try fallback default RPC for configured chain
  if (!deployed) {
    const defaultRpc = getDefaultRpcUrl(contractConfig.chainId);
    const fallbackProvider = new ethers.JsonRpcProvider(defaultRpc);
    const status = await checkContractDeployment(activeAddress, fallbackProvider);
    if (status.isDeployed) {
      activeProvider = fallbackProvider;
      deployed = true;
    }
  }

  // 3. If still not deployed, construct human-friendly diagnostic error
  if (!deployed) {
    const targetChain = contractConfig.chainId || 31337;
    const targetNet = contractConfig.network || "localhost";
    
    if (targetChain === 31337) {
      const err = new Error(
        `Smart contract not found at ${activeAddress} on Hardhat Localhost.\n\n` +
        `If you restarted your local node or terminal, the contract was reset. Please run:\n` +
        `1. npx hardhat node\n` +
        `2. npx hardhat run scripts/Depoly.ts --network localhost`
      );
      err.code = "CONTRACT_NOT_DEPLOYED";
      err.targetChainId = targetChain;
      err.activeAddress = activeAddress;
      throw err;
    } else {
      const err = new Error(
        `Smart contract not found at ${activeAddress} on network "${targetNet}" (Chain ID ${targetChain}).\n` +
        `Please ensure your wallet is connected to ${targetNet} or redeploy the contract to this network.`
      );
      err.code = "CONTRACT_NOT_DEPLOYED";
      err.targetChainId = targetChain;
      err.activeAddress = activeAddress;
      throw err;
    }
  }

  const factory = new ethers.Contract(activeAddress, contractConfig.factoryAbi, activeProvider);
  return { factory, activeProvider, activeAddress, error: null };
};

/**
 * Fetches all deployed campaigns and their details
 */
export const fetchAllCampaigns = async (providerOrSigner) => {
  try {
    const activeAddress = getActiveFactoryAddress();
    if (!activeAddress) return [];

    const { factory, activeProvider } = await resolveWorkingFactory(providerOrSigner);
    if (!factory) return [];

    // 1. Get array of all deployed campaign addresses
    let deployedAddresses = [];
    try {
      deployedAddresses = await factory.getDeployedCampaigns();
    } catch (callErr) {
      if (callErr.code === "CALL_EXCEPTION" && (!callErr.data || callErr.data === "0x")) {
        throw new Error(
          `Smart contract call failed at ${activeAddress}: No contract bytecode exists at this address on the active network. If using Hardhat, please ensure 'npx hardhat node' is running and contracts are deployed.`
        );
      }
      throw callErr;
    }

    console.log(`Found ${deployedAddresses.length} deployed campaigns`);

    if (!deployedAddresses || deployedAddresses.length === 0) {
      return [];
    }

    // 2. Fetch details for each campaign concurrently using Promise.all
    const campaigns = await Promise.all(
      deployedAddresses.map(async (address) => {
        try {
          // Check if bytecode exists at campaign contract address
          const code = await activeProvider.getCode(address).catch(() => "0x");
          if (!code || code === "0x" || code === "0x0") {
            console.warn(`No bytecode at campaign address ${address}, skipping.`);
            return null;
          }

          const campaignContract = new ethers.Contract(address, contractConfig.campaignAbi, activeProvider);
          
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
          console.error(`Failed to fetch details for campaign at ${address}:`, err.message);
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
    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      throw new Error(`Invalid campaign contract address: ${campaignAddress}`);
    }

    let activeProvider = getReadProvider(providerOrSigner);
    let status = await checkContractDeployment(campaignAddress, activeProvider);

    if (!status.isDeployed) {
      // Fallback to configured network RPC
      const defaultRpc = getDefaultRpcUrl(contractConfig.chainId);
      const fallbackProvider = new ethers.JsonRpcProvider(defaultRpc);
      const fallbackStatus = await checkContractDeployment(campaignAddress, fallbackProvider);
      if (fallbackStatus.isDeployed) {
        activeProvider = fallbackProvider;
      } else {
        throw new Error(
          `Campaign contract not found at address ${campaignAddress} on the current network.`
        );
      }
    }

    const campaignContract = new ethers.Contract(campaignAddress, contractConfig.campaignAbi, activeProvider);
    const summary = await campaignContract.getCampaignSummary();
    const rawDonations = await campaignContract.getDonations();

    const donations = (rawDonations || []).map((d) => ({
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

  const activeAddress = getActiveFactoryAddress();
  if (!activeAddress || !ethers.isAddress(activeAddress)) {
    throw new Error("CampaignFactory address not configured.");
  }

  // Check if factory is deployed on signer's provider
  if (signer.provider) {
    const status = await checkContractDeployment(activeAddress, signer.provider);
    if (!status.isDeployed) {
      const activeChainId = status.network ? Number(status.network.chainId) : "unknown";
      throw new Error(
        `CampaignFactory contract not found at ${activeAddress} on your connected wallet network (Chain ID ${activeChainId}). ` +
        `Please switch MetaMask to ${contractConfig.network} (Chain ID ${contractConfig.chainId}) where the contract was deployed.`
      );
    }
  }

  const factory = new ethers.Contract(activeAddress, contractConfig.factoryAbi, signer);
  const amountInWei = ethers.parseEther(requiredAmountEth.toString());

  console.log("Calling factory.createCampaign with:", {
    title,
    amountInWei: amountInWei.toString(),
    imageCid,
    storyCid,
    category,
  });

  const tx = await factory.createCampaign(
    title,
    amountInWei,
    imageCid || "",
    storyCid || "",
    category || "Other"
  );

  console.log("Transaction submitted, hash:", tx.hash);
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

  if (signer.provider) {
    const status = await checkContractDeployment(campaignAddress, signer.provider);
    if (!status.isDeployed) {
      const activeChainId = status.network ? Number(status.network.chainId) : "unknown";
      throw new Error(
        `Campaign contract not found at ${campaignAddress} on your connected wallet network (Chain ID ${activeChainId}). Please check your MetaMask network.`
      );
    }
  }

  const campaign = new ethers.Contract(campaignAddress, contractConfig.campaignAbi, signer);
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
