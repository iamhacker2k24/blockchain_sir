import { useState } from "react";
import { ethers } from "ethers";

const WalletSection = () => {
  const [address, setAddress] = useState("");

  const connectWallet = async () => {
    try {
      // Check MetaMask
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      // Connect wallet
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Create provider
      let provider = new ethers.BrowserProvider(window.ethereum);

      // Get current network
      let network = await provider.getNetwork();

      console.log("Current Chain ID:", network.chainId);

      // Polygon Amoy Chain ID = 80002
      if (network.chainId !== 80002n) {
        try {
          // Try switching to Amoy
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
              {
                chainId: "0x13882",
              },
            ],
          });
        } catch (error) {
          // 4902 means network is not added to MetaMask
          if (error.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13882",
                  chainName: "Polygon Amoy Testnet",

                  nativeCurrency: {
                    name: "POL",
                    symbol: "POL",
                    decimals: 18,
                  },

                  rpcUrls: [
                    "https://rpc-amoy.polygon.technology/",
                  ],

                  blockExplorerUrls: [
                    "https://amoy.polygonscan.com/",
                  ],
                },
              ],
            });
          } else {
            throw error;
          }
        }
      }

      // Create provider again after network switch
      provider = new ethers.BrowserProvider(window.ethereum);

      // Get signer
      const signer = await provider.getSigner();

      // Get wallet address
      const walletAddress = await signer.getAddress();

      setAddress(walletAddress);

      console.log("Connected:", walletAddress);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  return (
    <div onClick={connectWallet}>
      {address
        ? `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </div>
  );
};

export default WalletSection;


// 3.13