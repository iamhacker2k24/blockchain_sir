import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

/**
 * ============================================================================
 * WEB3 CONTEXT - BLOCKCHAIN WALLET & NETWORK MANAGER
 * ============================================================================
 * 
 * For Beginners:
 * - What is a Provider? An Ethers object that connects to the Ethereum network to read data (balance, blocks, contracts).
 * - What is a Signer? An Ethers object linked to the user's private key (via MetaMask) that can sign and send transactions (paying gas).
 * - What is a Chain ID? A unique number identifying each blockchain network (e.g. 80002 for Polygon Amoy, 11155111 for Sepolia, 1 for Ethereum Mainnet).
 */

const Web3Context = createContext(null);

import contractConfig from "../contracts/contractConfig.json";

// Supported Testnet Configurations
export const SUPPORTED_NETWORKS = {
  80002: {
    chainId: "0x13882", // Hexadecimal for 80002
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: [
      "https://rpc-amoy.polygon.technology/",
      "https://polygon-amoy.drpc.org",
      "https://polygon-amoy-bor-rpc.publicnode.com",
    ],
    blockExplorerUrls: ["https://amoy.polygonscan.com/"],
  },
  11155111: {
    chainId: "0xaa36a7", // Hexadecimal for 11155111
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
  },
  31337: {
    chainId: "0x7a69", // Hexadecimal for 31337
    chainName: "Hardhat Localhost",
    nativeCurrency: { name: "GO", symbol: "ETH", decimals: 18 },
    rpcUrls: ["http://127.0.0.1:8545/"],
    blockExplorerUrls: [],
  },
};

// Target network dynamically matches the deployed contract (Localhost 31337 or Amoy 80002)
export const DEFAULT_CHAIN_ID = contractConfig.chainId || 80002;

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Helper to format balance to human-readable string (e.g. "1.2345 POL")
   */
  const fetchBalance = useCallback(async (walletAddress, ethersProvider) => {
    try {
      if (!walletAddress || !ethersProvider) return "0";
      const rawBalance = await ethersProvider.getBalance(walletAddress);
      // ethers.formatEther converts wei (10^18) to whole tokens
      const formatted = ethers.formatEther(rawBalance);
      // Show up to 4 decimal places for clean UI
      return parseFloat(formatted).toFixed(4);
    } catch (err) {
      console.error("Error fetching balance:", err);
      return "0";
    }
  }, []);

  /**
   * Switch or add the desired network in MetaMask
   */
  const switchNetwork = async (targetChainId = DEFAULT_CHAIN_ID) => {
    if (!window.ethereum) {
      alert("Please install MetaMask to switch networks!");
      return false;
    }

    const netConfig = SUPPORTED_NETWORKS[targetChainId];
    if (!netConfig) {
      console.error("Network config not found for chainId:", targetChainId);
      return false;
    }

    try {
      // Ask MetaMask to switch to the target chain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: netConfig.chainId }],
      });
      return true;
    } catch (switchError) {
      // Error code 4902 indicates that the network has not yet been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [netConfig],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add network to MetaMask:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  };

  /**
   * Connects the user's MetaMask wallet
   */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask extension from metamask.io");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // 1. Request access to user's accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // 2. In Ethers v6, we use BrowserProvider to interact with window.ethereum
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      // 3. Switch to default network if not already on it
      if (currentChainId !== DEFAULT_CHAIN_ID && currentChainId !== 31337 && currentChainId !== 11155111) {
        const switched = await switchNetwork(DEFAULT_CHAIN_ID);
        if (!switched) {
          console.warn("User declined or failed network switch to Amoy.");
        }
      }

      // 4. Re-create provider after any network switch
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const updatedSigner = await updatedProvider.getSigner();
      const address = await updatedSigner.getAddress();
      const currentNetwork = await updatedProvider.getNetwork();
      const activeChainId = Number(currentNetwork.chainId);

      const bal = await fetchBalance(address, updatedProvider);

      // 5. Update React state
      setProvider(updatedProvider);
      setSigner(updatedSigner);
      setAccount(address);
      setBalance(bal);
      setChainId(activeChainId);
      setNetworkName(SUPPORTED_NETWORKS[activeChainId]?.chainName || `Chain ID ${activeChainId}`);
      
      console.log("Connected successfully to:", address, "on chain:", activeChainId);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnects the wallet from the frontend state
   */
  const disconnectWallet = () => {
    setAccount("");
    setBalance("0");
    setSigner(null);
  };

  /**
   * Listen to MetaMask events:
   * - accountsChanged: when the user switches accounts in MetaMask
   * - chainChanged: when the user changes networks in MetaMask
   */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their account in MetaMask
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        setAccount(newAddress);
        if (provider) {
          const bal = await fetchBalance(newAddress, provider);
          setBalance(bal);
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
        }
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change as strongly recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Auto-check if wallet was already connected previously (runs once on mount)
    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const browserSigner = await browserProvider.getSigner();
          const address = accounts[0];
          const net = await browserProvider.getNetwork();
          const activeChainId = Number(net.chainId);
          const bal = await fetchBalance(address, browserProvider);

          setProvider(browserProvider);
          setSigner(browserSigner);
          setAccount(address);
          setBalance(bal);
          setChainId(activeChainId);
          setNetworkName(SUPPORTED_NETWORKS[activeChainId]?.chainName || `Chain ID ${activeChainId}`);
        }
      } catch (err) {
        console.warn("Auto-connect check error:", err);
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [fetchBalance]);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        networkName,
        provider,
        signer,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        fetchBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
