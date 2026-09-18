import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Hardhat Deployment Script for CampaignFactory
 * 
 * What this script does:
 * 1. Connects to the active network (Localhost, Polygon Amoy, Sepolia, etc.)
 * 2. Gets the deployer wallet (signer)
 * 3. Deploys the CampaignFactory smart contract
 * 4. Waits for deployment confirmation on the blockchain
 * 5. Automatically writes the deployed address and ABIs to `front/src/contracts/contractConfig.json`
 *    so the frontend React app can connect to it immediately!
 */
async function main() {
    console.log("----------------------------------------------------");
    console.log("Starting CampaignFactory deployment...");

    const { ethers } = await network.create();
    const [deployer] = await ethers.getSigners();

    console.log("Deployer account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "native tokens");

    // 1. Get contract factory
    const Factory = await ethers.getContractFactory("CampaignFactory");
    
    // 2. Send deployment transaction
    console.log("Deploying contract...");
    const factory = await Factory.deploy();

    // 3. Wait for the transaction to be mined
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log("SUCCESS! CampaignFactory deployed to:", factoryAddress);
    console.log("----------------------------------------------------");

    // 4. Save configuration file for the React frontend
    const configDir = path.resolve(process.cwd(), "src/contracts");
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const configPath = path.join(configDir, "contractConfig.json");

    // Read artifact ABIs
    const factoryArtifactPath = path.resolve(process.cwd(), "artifacts/contracts/Campign.sol/CampaignFactory.json");
    const campaignArtifactPath = path.resolve(process.cwd(), "artifacts/contracts/Campign.sol/Campaign.json");

    let factoryAbi = [];
    let campaignAbi = [];

    if (fs.existsSync(factoryArtifactPath)) {
        const parsed = JSON.parse(fs.readFileSync(factoryArtifactPath, "utf-8"));
        factoryAbi = parsed.abi;
    }
    if (fs.existsSync(campaignArtifactPath)) {
        const parsed = JSON.parse(fs.readFileSync(campaignArtifactPath, "utf-8"));
        campaignAbi = parsed.abi;
    }

    const configData = {
        factoryAddress: factoryAddress,
        network: (await ethers.provider.getNetwork()).name || "unknown",
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployedAt: new Date().toISOString(),
        factoryAbi: factoryAbi,
        campaignAbi: campaignAbi
    };

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log("Configuration successfully written to:", configPath);
    console.log("----------------------------------------------------");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
});
