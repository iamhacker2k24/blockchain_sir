import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";
import { fetchAllCampaigns, getCampaignContract, getIpfsUrl } from "../../services/contractService";
import { ethers } from "ethers";

const MyCampaigns = () => {
  const { account, provider, chainId, connectWallet } = useWeb3();

  const [createdCampaigns, setCreatedCampaigns] = useState([]);
  const [backedCampaigns, setBackedCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("created"); // "created" | "backed"
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const all = await fetchAllCampaigns(provider);

      // 1. Filter campaigns created by this wallet
      const myCreated = all.filter(
        (c) => c.owner.toLowerCase() === account.toLowerCase()
      );
      setCreatedCampaigns(myCreated);

      // 2. Check for donations made by this wallet across campaigns
      const backed = [];
      await Promise.all(
        all.map(async (c) => {
          try {
            const contract = getCampaignContract(c.address, provider);
            const donations = await contract.getDonations();
            const myDonations = donations.filter(
              (d) => d.donor.toLowerCase() === account.toLowerCase()
            );

            if (myDonations.length > 0) {
              const myTotalDonated = myDonations.reduce(
                (sum, d) => sum + parseFloat(ethers.formatEther(d.amount)),
                0
              );
              backed.push({
                ...c,
                myTotalDonated: myTotalDonated.toFixed(4),
                donationCount: myDonations.length,
              });
            }
          } catch (e) {
            console.error(`Error checking donations for campaign ${c.address}:`, e);
          }
        })
      );

      setBackedCampaigns(backed);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [account, chainId]);

  if (!account) {
    return (
      <div className="py-20 text-center space-y-4 animate-in fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
          👛
        </div>
        <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
        <p className="max-w-md mx-auto text-xs text-gray-400">
          Connect your MetaMask wallet to see your created fundraisers, tracks funds raised, and view donation history.
        </p>
        <div className="pt-2">
          <button
            onClick={connectWallet}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalRaised = createdCampaigns
    .reduce((acc, c) => acc + parseFloat(c.receivedAmount || 0), 0)
    .toFixed(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 mb-2">
          Creator Dashboard
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          My Fundraisers & Activity
        </h1>
        <p className="mt-1 font-mono text-xs text-gray-400">
          Connected Wallet: <span className="text-violet-400">{account}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#12141e] p-5 space-y-1">
          <p className="text-xs font-medium text-gray-400">Campaigns Created</p>
          <p className="text-3xl font-extrabold text-white">{createdCampaigns.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141e] p-5 space-y-1">
          <p className="text-xs font-medium text-gray-400">Total Funds Received</p>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {totalRaised} POL
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141e] p-5 space-y-1">
          <p className="text-xs font-medium text-gray-400">Campaigns Backed</p>
          <p className="text-3xl font-extrabold text-violet-400">{backedCampaigns.length}</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/10 gap-4">
        <button
          onClick={() => setActiveTab("created")}
          className={`pb-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === "created"
              ? "border-violet-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          My Campaigns ({createdCampaigns.length})
        </button>

        <button
          onClick={() => setActiveTab("backed")}
          className={`pb-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === "backed"
              ? "border-violet-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Backed Campaigns ({backedCampaigns.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-xs text-gray-400">
          Loading your blockchain activity...
        </div>
      )}

      {/* Tab 1: Created Campaigns */}
      {!loading && activeTab === "created" && (
        <div>
          {createdCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#11131a] p-10 text-center space-y-3">
              <p className="text-sm text-gray-400">You haven't created any campaigns yet.</p>
              <Link
                to="/create-campaign"
                className="inline-block rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
              >
                + Launch a Campaign
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdCampaigns.map((c) => (
                <div
                  key={c.address}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#12141e] overflow-hidden p-5 space-y-4"
                >
                  <div className="h-40 overflow-hidden rounded-xl bg-black/40">
                    <img
                      src={getIpfsUrl(c.image)}
                      alt={c.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-violet-400">
                      {c.category}
                    </span>
                    <h3 className="text-base font-bold text-white line-clamp-1 mt-0.5">
                      {c.title}
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Raised</span>
                      <strong className="text-white font-mono">{c.receivedAmount} POL</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Goal</span>
                      <span className="font-mono">{c.requiredAmount} POL</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${Math.min(c.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/campaign/${c.address}`}
                    className="mt-auto block w-full rounded-xl bg-white/10 py-2 text-center text-xs font-semibold text-white hover:bg-white/15"
                  >
                    View Campaign →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Backed Campaigns */}
      {!loading && activeTab === "backed" && (
        <div>
          {backedCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#11131a] p-10 text-center space-y-3">
              <p className="text-sm text-gray-400">You haven't donated to any campaigns yet.</p>
              <Link
                to="/"
                className="inline-block rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
              >
                Explore Campaigns
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backedCampaigns.map((c) => (
                <div
                  key={c.address}
                  className="rounded-2xl border border-white/10 bg-[#12141e] p-5 space-y-3"
                >
                  <span className="text-[10px] font-bold uppercase text-violet-400">
                    {c.category}
                  </span>
                  <h3 className="text-base font-bold text-white line-clamp-1">{c.title}</h3>
                  <div className="rounded-xl bg-violet-950/30 border border-violet-800/30 p-3 space-y-1 text-xs">
                    <p className="text-gray-400">You Contributed:</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono">
                      {c.myTotalDonated} POL
                    </p>
                  </div>
                  <Link
                    to={`/campaign/${c.address}`}
                    className="block w-full rounded-xl bg-white/10 py-2 text-center text-xs font-semibold text-white hover:bg-white/15"
                  >
                    View Campaign →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCampaigns;
