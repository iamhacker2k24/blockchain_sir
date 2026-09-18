import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllCampaigns, getIpfsUrl } from "../../services/contractService";
import { useWeb3 } from "../../context/Web3Context";
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
  const { provider, account, chainId } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddress, setCustomAddress] = useState(contractConfig.factoryAddress || "");

  // Load campaigns from blockchain
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if factory is configured
      const activeAddress = customAddress || contractConfig.factoryAddress;
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
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on Polygon Amoy Testnet
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
            <p className="text-2xl sm:text-3xl font-bold text-violet-400 mt-0.5">{totalRaised} POL</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-gray-400">Smart Contract</p>
            <p className="text-xs font-mono text-gray-300 mt-2 truncate">
              {contractConfig.factoryAddress || "Not deployed yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Configuration Notice if Not Yet Deployed */}
      {!contractConfig.factoryAddress && (
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

      {/* Error Message */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300 space-y-2">
          <p className="font-semibold text-red-200">Unable to load campaigns</p>
          <p className="text-xs">{error}</p>
          <button
            onClick={loadCampaigns}
            className="mt-3 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/30"
          >
            Try Again
          </button>
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
