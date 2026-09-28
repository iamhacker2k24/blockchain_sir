import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllCampaigns, getIpfsUrl, getActiveFactoryAddress } from "../../services/contractService";
import { useWeb3, SUPPORTED_NETWORKS } from "../../context/Web3Context";
import contractConfig from "../../contracts/contractConfig.json";

const CATEGORIES = [
  "All",
  "Medical",
  "Education",
  "Charity",
  "Emergency",
  "Startup",
  "Community",
  "Other",
];

const Campigns = () => {
  const { provider, account, chainId, switchNetwork } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddress, setCustomAddress] = useState(
    localStorage.getItem("FUNDRAISER_FACTORY_ADDRESS") || contractConfig.factoryAddress || ""
  );

  const targetChainId = contractConfig.chainId || 31337;
  const targetNetworkConfig = SUPPORTED_NETWORKS[targetChainId];
  const targetNetworkName = targetNetworkConfig?.chainName || contractConfig.network || "Hardhat Localhost";
  const currencySymbol = targetNetworkConfig?.nativeCurrency?.symbol || "POL";
  const isNetworkMatch = !chainId || chainId === targetChainId;

  // Load campaigns from blockchain
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if factory is configured
      const activeAddress = getActiveFactoryAddress();
      if (!activeAddress) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const data = await fetchAllCampaigns(provider);
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      setError(err.message || "Failed to load campaigns from blockchain");
    } finally {
      setLoading(false);
    }
  };

  // Only re-fetch when the network changes or on initial mount
  useEffect(() => {
    loadCampaigns();
  }, [chainId]);

  // Filter campaigns by category and search term
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCategory =
      selectedCategory === "All" ||
      c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate high-level stats
  const totalRaised = campaigns
    .reduce((acc, c) => acc + parseFloat(c.receivedAmount || 0), 0)
    .toFixed(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner with Stats */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-[#11131c] to-[#0a0c10] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <span className={`h-2 w-2 rounded-full ${isNetworkMatch ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
            Live on {targetNetworkName}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Fund the Future, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              One Block at a Time.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Support creative projects, verified emergencies, and community causes with transparent Web3 donations.
          </p>
        </div>

        {/* Platform Stats Row */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <div>
            <p className="text-xs font-medium text-gray-400">Total Campaigns</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-0.5">{campaigns.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Total Funds Raised</p>
            <p className="text-2xl sm:text-3xl font-bold text-violet-400 mt-0.5">{totalRaised} {currencySymbol}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-gray-400">Smart Contract</p>
            <p className="text-xs font-mono text-gray-300 mt-2 truncate" title={customAddress || contractConfig.factoryAddress}>
              {customAddress || contractConfig.factoryAddress || "Not deployed yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Configuration Notice if Not Yet Deployed */}
      {(!contractConfig.factoryAddress && !customAddress) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <h3 className="font-semibold text-amber-100">Smart Contract Not Configured</h3>
              <p className="text-xs text-amber-300">
                To link your smart contract, run the deployment script in your terminal:
                <code className="mx-1 rounded bg-black/40 px-2 py-0.5 font-mono text-xs text-white">
                  npx hardhat run scripts/Depoly.ts --network localhost
                </code>
                or enter your deployed address below:
              </p>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="0x... Factory Address"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white font-mono w-72 outline-none"
                />
                <button
                  onClick={() => {
                    localStorage.setItem("FUNDRAISER_FACTORY_ADDRESS", customAddress);
                    loadCampaigns();
                  }}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Section */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "border border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#12151f] px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl border border-white/5 bg-[#12141d] animate-pulse p-4 space-y-4"
            >
              <div className="h-48 bg-white/5 rounded-xl" />
              <div className="h-5 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-10 bg-white/5 rounded-xl mt-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Error & Troubleshooting Card */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 sm:p-8 text-red-200 space-y-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-red-100">Unable to Load Campaigns from Blockchain</h3>
              <p className="text-xs text-red-300/90 whitespace-pre-line font-mono bg-black/40 p-3 rounded-xl border border-red-500/20">
                {error}
              </p>
            </div>
          </div>

          {/* Quick Troubleshooting Actions */}
          <div className="border-t border-red-500/20 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Action 1: Network Mismatch */}
            {!isNetworkMatch && chainId && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                <p className="font-semibold text-white">🔄 Network Mismatch Detected</p>
                <p className="text-gray-400">
                  Your wallet is on <span className="text-amber-300 font-mono">{SUPPORTED_NETWORKS[chainId]?.chainName || `Chain ${chainId}`}</span>, but the contract is configured for <span className="text-violet-300 font-mono">{targetNetworkName} (Chain {targetChainId})</span>.
                </p>
                <button
                  onClick={() => switchNetwork(targetChainId)}
                  className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white shadow hover:bg-violet-500 transition"
                >
                  Switch Network to {targetNetworkName}
                </button>
              </div>
            )}

            {/* Action 2: Hardhat Localhost Helper */}
            {targetChainId === 31337 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 col-span-1 md:col-span-2">
                <p className="font-semibold text-white">💻 Hardhat Localhost Instructions</p>
                <p className="text-gray-400">
                  Hardhat local nodes reset on restart. If your node was restarted, execute these two commands in your terminal:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 font-mono text-xs">
                  <div className="flex-1 rounded-lg bg-black/60 border border-white/10 p-2 text-violet-300 select-all">
                    1. npx hardhat node
                  </div>
                  <div className="flex-1 rounded-lg bg-black/60 border border-white/10 p-2 text-indigo-300 select-all">
                    2. npx hardhat run scripts/Depoly.ts --network localhost
                  </div>
                </div>
              </div>
            )}

            {/* Action 3: Override Contract Address */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 col-span-1 md:col-span-2">
              <p className="font-semibold text-white">🎯 Override Contract Address</p>
              <p className="text-gray-400">
                If you deployed to a custom or newly generated address, paste it below to link it immediately:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="0x... Factory Address"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="flex-1 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => {
                    localStorage.setItem("FUNDRAISER_FACTORY_ADDRESS", customAddress.trim());
                    loadCampaigns();
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 transition text-xs"
                >
                  Save & Reload
                </button>
                {localStorage.getItem("FUNDRAISER_FACTORY_ADDRESS") && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("FUNDRAISER_FACTORY_ADDRESS");
                      setCustomAddress(contractConfig.factoryAddress || "");
                      loadCampaigns();
                    }}
                    className="rounded-lg bg-white/10 px-3 py-2 font-semibold text-gray-300 hover:bg-white/20 transition text-xs"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={loadCampaigns}
              className="rounded-xl bg-red-500/20 border border-red-500/40 px-5 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/30 transition"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCampaigns.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#11131a] p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
            🌱
          </div>
          <h3 className="text-xl font-bold text-white">No campaigns found</h3>
          <p className="max-w-md mx-auto text-xs text-gray-400">
            {campaigns.length === 0
              ? "No campaigns have been deployed yet. Be the first one to start a campaign on the blockchain!"
              : "No campaigns matched your search or category filter."}
          </p>
          <div className="pt-2">
            <Link
              to="/create-campaign"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition"
            >
              + Create First Campaign
            </Link>
          </div>
        </div>
      )}

      {/* Campaign Cards Grid */}
      {!loading && filteredCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.address}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12141e] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-600/10"
            >
              {/* Campaign Image */}
              <div className="relative h-48 w-full overflow-hidden bg-black/40">
                <img
                  src={getIpfsUrl(campaign.image)}
                  alt={campaign.title}
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80";
                  }}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                  {campaign.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-violet-300 transition">
                    {campaign.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                    {campaign.story || "No description provided."}
                  </p>
                </div>

                {/* Owner Tag */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Creator</span>
                  <span className="font-mono text-violet-400 bg-violet-950/40 border border-violet-800/40 rounded px-2 py-0.5 text-[11px]">
                    {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
                  </span>
                </div>

                {/* Progress Bar & Amount */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      Raised: <strong className="text-white font-mono">{campaign.receivedAmount}</strong> POL
                    </span>
                    <span className="font-bold text-violet-400">
                      {campaign.percentage}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(campaign.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Target: {campaign.requiredAmount} POL</span>
                    <span>{campaign.donationsCount || 0} donations</span>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="pt-2 mt-auto">
                  <Link
                    to={`/campaign/${campaign.address}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600/90 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-95"
                  >
                    <span>View & Donate</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campigns;
