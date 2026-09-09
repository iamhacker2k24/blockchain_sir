import { network } from "hardhat";

const { ethers } = await network.create();

async function main() {
    console.log("Deploying Campinfactory...");

    const Factory = await ethers.getContractFactory("Campinfactory");
    const factory = await Factory.deploy();

    await factory.waitForDeployment();

    const address = await factory.getAddress();

    console.log("Campinfactory deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
