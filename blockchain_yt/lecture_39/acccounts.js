const { ethers } = require("ethers")

const rpc = '';
const account1 = '';
const privetkey = '';
const provider = '';

 const account = new ethers.Wallet(
    privetkey,
    provider
 );

async function call() {
    const bal = await provider.getBalance(account1)

    console.log(ethers.utils.formatEther)
}