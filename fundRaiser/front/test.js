/**
 * ============================================================================
 * TEST SCRIPT (Node.js + Ethers v6)
 * ============================================================================
 * 
 * How to run this script:
 *   cd front
 *   node test.js
 * 
 * Educational Notes for Beginners:
 * 1. In Ethers v5 (2022): new ethers.providers.JsonRpcProvider()
 *    In Ethers v6 (Modern): new ethers.JsonRpcProvider()
 * 2. In Ethers v5: ethers.utils.formatEther()
 *    In Ethers v6: ethers.formatEther()
 * 3. In Ethers v5: BigNumber objects
 *    In Ethers v6: native JavaScript BigInt (e.g. 1000000000000000000n)
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read contract config
const configPath = path.join(__dirname, "src/contracts/contractConfig.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

async function main() {
  console.log("=== Testing Blockchain Connection & Contracts ===");

  // 1. Connect to network (auto-detects localhost vs Amoy)
  const defaultRpc = config.chainId === 31337 
    ? "http://127.0.0.1:8545" 
    : (process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/");
  const RPC_URL = process.env.RPC_URL || defaultRpc;
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const network = await provider.getNetwork();
  console.log("Connected to Network:", network.name, "| Chain ID:", Number(network.chainId));

  // 2. Check if factory address is configured
  const factoryAddress = config.factoryAddress;
  console.log("Configured Factory Address:", factoryAddress || "(None configured yet)");

  if (!factoryAddress || !ethers.isAddress(factoryAddress)) {
    console.log("\nTIP: Deploy your contract using:");
    console.log("  npx hardhat run scripts/Depoly.ts --network amoy");
    return;
  }

  // 3. Connect to CampaignFactory contract
  const factory = new ethers.Contract(factoryAddress, config.factoryAbi, provider);

  // 4. Fetch all deployed campaigns
  const deployed = await factory.getDeployedCampaigns();
  console.log(`\nTotal deployed campaigns: ${deployed.length}`);

  for (let i = 0; i < deployed.length; i++) {
    const campaignAddress = deployed[i];
    console.log(`\n[Campaign #${i + 1}] Address: ${campaignAddress}`);

    const campaign = new ethers.Contract(campaignAddress, config.campaignAbi, provider);
    const summary = await campaign.getCampaignSummary();

    console.log("  Title:", summary._title);
    console.log("  Category:", summary._category);
    console.log("  Goal:", ethers.formatEther(summary._requiredAmount), "POL");
    console.log("  Raised:", ethers.formatEther(summary._receivedAmount), "POL");
    console.log("  Owner:", summary._owner);
    console.log("  Donations Count:", Number(summary._donationsCount));
  }
}

main().catch((err) => {
  console.error("Test error:", err);
});