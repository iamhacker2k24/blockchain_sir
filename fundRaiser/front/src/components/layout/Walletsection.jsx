import React, { useState } from "react";
import { useWeb3, SUPPORTED_NETWORKS, DEFAULT_CHAIN_ID } from "../../context/Web3Context";

const WalletSection = () => {
  const {
    account,
    balance,
    chainId,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWeb3();

  const [showDropdown, setShowDropdown] = useState(false);

  // Is user on Polygon Amoy (80002)?
  const isTargetNetwork = chainId === DEFAULT_CHAIN_ID;
  const currentNetConfig = SUPPORTED_NETWORKS[chainId];
  const currencySymbol = currentNetConfig?.nativeCurrency?.symbol || "POL";

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1 shadow-sm">
        {/* Network indicator pill */}
        <button
          onClick={() => switchNetwork(DEFAULT_CHAIN_ID)}
          title={isTargetNetwork ? `Connected to ${currentNetConfig?.chainName}` : `Click to switch to ${SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID]?.chainName}`}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
            isTargetNetwork
              ? "bg-purple-950/60 text-purple-300 border border-purple-500/30"
              : "bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isTargetNetwork ? "bg-purple-400" : "bg-amber-400 animate-ping"
            }`}
          />
          {isTargetNetwork ? (currentNetConfig?.chainName || "Connected") : `Switch to ${SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID]?.chainName || "Target Network"}`}
        </button>

        {/* Balance Display */}
        <div className="hidden sm:flex items-center px-2 text-xs font-mono text-gray-300">
          <span className="font-semibold text-white mr-1">{balance}</span>
          <span className="text-[10px] text-violet-400">{currencySymbol}</span>
        </div>

        {/* Wallet Address Pill & Dropdown Toggle */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-mono font-medium text-white transition hover:bg-white/15"
        >
          <span>
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <span className="text-[10px] text-gray-400">▼</span>
        </button>
      </div>

      {/* Account Dropdown Modal */}
      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#141721] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Connected Account</p>
            <p className="font-mono text-xs text-white break-all mt-1">{account}</p>
          </div>

          <div className="mb-3 flex justify-between items-center text-xs">
            <span className="text-gray-400">Balance:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {balance} {currencySymbol}
            </span>
          </div>

          <div className="mb-3 flex justify-between items-center text-xs">
            <span className="text-gray-400">Network:</span>
            <span className="font-medium text-violet-300">
              {currentNetConfig?.chainName || `Chain ID ${chainId}`}
            </span>
          </div>

          {/* Quick copy address */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(account);
              alert("Address copied to clipboard!");
            }}
            className="w-full mb-2 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10"
          >
            Copy Address
          </button>

          {/* Disconnect button */}
          <button
            onClick={() => {
              disconnectWallet();
              setShowDropdown(false);
            }}
            className="w-full rounded-lg bg-rose-600/20 border border-rose-500/30 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-600/30"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletSection;
