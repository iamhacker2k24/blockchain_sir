import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCampaignDetails, donateToCampaign, getIpfsUrl } from "../../services/contractService";
import { useWeb3 } from "../../context/Web3Context";

const CampaignDetails = () => {
  const { address } = useParams();
  const { signer, account, chainId, connectWallet, fetchBalance, provider } = useWeb3();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [txSuccess, setTxSuccess] = useState(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaignDetails(address, provider || signer);
      setCampaign(data);
    } catch (err) {
      console.error("Failed to load campaign details:", err);
      setError(err.message || "Failed to load campaign details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadDetails();
    }
  }, [address, chainId]);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!account) {
      connectWallet();
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please enter a valid donation amount greater than 0");
      return;
    }

    try {
      setIsDonating(true);
      setTxSuccess(null);

      const result = await donateToCampaign({
        campaignAddress: address,
        amountEth: donationAmount,
        signer,
      });

      setTxSuccess(result.txHash);
      setDonationAmount("");

      // Refresh balance and campaign state
      if (account && provider) {
        await fetchBalance(account, provider);
      }
      await loadDetails();
      alert("🎉 Donation successful! Thank you for your support.");
    } catch (err) {
      console.error("Donation error:", err);
      alert(`Donation failed: ${err.reason || err.message || "User rejected transaction"}`);
    } finally {
      setIsDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading campaign details from blockchain...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="text-4xl">❌</div>
        <h2 className="text-xl font-bold text-white">Campaign Not Found</h2>
        <p className="text-xs text-red-400 max-w-md mx-auto">{error || "Could not find campaign at this address."}</p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          ← Back to All Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/" className="hover:text-white transition">
          Campaigns
        </Link>
        <span>/</span>
        <span className="text-violet-400 font-medium truncate max-w-xs">{campaign.title}</span>
      </div>

      {/* Main Grid: Left Column (Image & Story), Right Column (Donation Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Visuals & Story */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Campaign Image */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#12141e] shadow-2xl relative">
            <img
              src={getIpfsUrl(campaign.image)}
              alt={campaign.title}
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=80";
              }}
              className="w-full max-h-[420px] object-cover"
            />
            <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {campaign.category}
            </div>
          </div>

          {/* Campaign Details Header */}
          <div className="rounded-3xl border border-white/10 bg-[#11131a] p-6 sm:p-8 space-y-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {campaign.title}
            </h1>

            {/* Creator Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                  {campaign.owner.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-400">Created by</p>
                  <p className="font-mono font-medium text-white truncate max-w-[200px] sm:max-w-none">
                    {campaign.owner}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://amoy.polygonscan.com/address/${campaign.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  View on Polygonscan ↗
                </a>
              </div>
            </div>

            {/* Campaign Story */}
            <div className="space-y-3 pt-2">
              <h3 className="text-lg font-bold text-white">About this Campaign</h3>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-[#0d0f17] p-5 rounded-2xl border border-white/5 font-sans">
                {campaign.story || "No additional story provided by the creator."}
              </div>
            </div>
          </div>

          {/* Recent Donors Table */}
          <div className="rounded-3xl border border-white/10 bg-[#11131a] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Recent Donors ({campaign.donations?.length || 0})
              </h3>
              <span className="text-xs text-gray-400">Transparency Verified</span>
            </div>

            {(!campaign.donations || campaign.donations.length === 0) ? (
              <p className="text-xs text-gray-500 py-4 text-center italic">
                No donations made yet. Be the first backer!
              </p>
            ) : (
              <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-[#0e1017]">
                {campaign.donations.map((d, index) => (
                  <div key={index} className="flex items-center justify-between p-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300 font-bold">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-mono text-white">
                          {d.donor.slice(0, 6)}...{d.donor.slice(-4)}
                        </p>
                        <p className="text-[10px] text-gray-500">{d.date}</p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      +{d.amount} POL
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Donation Widget */}
        <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#121520] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Fundraising Progress
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {campaign.receivedAmount}
              </span>
              <span className="text-sm text-gray-400">of {campaign.requiredAmount} POL goal</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-500"
                style={{ width: `${Math.min(campaign.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>{campaign.percentage}% Funded</span>
              <span>{campaign.donations?.length || 0} Backers</span>
            </div>
          </div>

          {/* Donation Form */}
          <form onSubmit={handleDonate} className="space-y-4 border-t border-white/10 pt-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Select or Enter Amount (POL)
              </label>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {["0.01", "0.05", "0.1", "0.5"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDonationAmount(preset)}
                    className={`rounded-xl py-2 text-xs font-bold transition border ${
                      donationAmount === preset
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#181a26] focus-within:border-violet-500">
                <span className="flex items-center border-r border-white/10 px-3 text-xs text-violet-400 font-mono">
                  POL
                </span>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.00"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 font-mono"
                />
              </div>
            </div>

            {/* Donate Button */}
            <button
              type="submit"
              disabled={isDonating}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 transition hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50"
            >
              {isDonating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Confirming on Blockchain...
                </span>
              ) : account ? (
                "Back this Campaign Now →"
              ) : (
                "Connect Wallet to Donate"
              )}
            </button>

            {txSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs text-emerald-300">
                ✓ Confirmed!{" "}
                <a
                  href={`https://amoy.polygonscan.com/tx/${txSuccess}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-mono"
                >
                  View Transaction ↗
                </a>
              </div>
            )}

            <p className="text-[11px] text-gray-500 text-center">
              100% of your funds are transferred directly to the creator's wallet on Polygon Amoy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
