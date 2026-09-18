import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";
import { createCampaignOnChain } from "../../services/contractService";

const From = () => {
  const navigate = useNavigate();
  const { account, signer, connectWallet } = useWeb3();

  const [campaignTitle, setCampaignTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("Medical");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [imageCid, setImageCid] = useState("");
  const [storyCid, setStoryCid] = useState("");

  const [statusStep, setStatusStep] = useState(""); // "ipfs" | "blockchain" | "done"
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle local image selection & preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 1. Upload assets to IPFS via the Express backend
  const uploadToIpfsBackend = async () => {
    if (!photo && !story.trim()) {
      return { imageCid: "", storyCid: "" };
    }

    const formData = new FormData();
    if (photo) formData.append("photo", photo);
    if (story.trim()) formData.append("story", story.trim());

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const response = await fetch(`${backendUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || "IPFS upload failed");
    }

    if (data.imageCid) setImageCid(data.imageCid);
    if (data.storyCid) setStoryCid(data.storyCid);

    return {
      imageCid: data.imageCid || "",
      storyCid: data.storyCid || "",
    };
  };

  // 2. Full Flow: Upload to IPFS + Create Campaign on Blockchain
  const handleSubmitCampaign = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!account) {
      connectWallet();
      return;
    }

    if (!campaignTitle.trim()) {
      alert("Please enter a campaign title");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid target amount (greater than 0)");
      return;
    }

    try {
      setIsLoading(true);

      // STEP 1: Upload to IPFS
      let uploadedImageCid = imageCid;
      let uploadedStoryCid = storyCid;

      if (!uploadedImageCid && photo) {
        setStatusStep("Uploading assets to IPFS...");
        try {
          const ipfsRes = await uploadToIpfsBackend();
          uploadedImageCid = ipfsRes.imageCid;
          uploadedStoryCid = ipfsRes.storyCid;
        } catch (ipfsErr) {
          console.warn("Backend IPFS upload warning:", ipfsErr.message);
          // Fallback to placeholder or direct text if local backend is offline
          if (!uploadedImageCid) {
            uploadedImageCid = "QmPlaceholder";
          }
        }
      }

      // STEP 2: Deploy Campaign on Blockchain via MetaMask
      setStatusStep("Please sign the transaction in MetaMask...");

      const { txHash, receipt } = await createCampaignOnChain({
        title: campaignTitle.trim(),
        requiredAmountEth: amount,
        imageCid: uploadedImageCid,
        storyCid: story.trim() || uploadedStoryCid,
        category: category,
        signer: signer,
      });

      console.log("Campaign created successfully! Tx:", txHash);
      setStatusStep("done");

      alert("🎉 Campaign deployed to the blockchain successfully!");
      navigate("/");
    } catch (err) {
      console.error("Campaign creation error:", err);
      setErrorMessage(err.reason || err.message || "Failed to create campaign");
    } finally {
      setIsLoading(false);
      setStatusStep("");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-8 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl space-y-6">
        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 mb-2">
            Step 1 • Create Fundraiser
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Start a Campaign
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Deploy your fundraiser directly to the Polygon blockchain and raise funds transparently.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmitCampaign}
          className="rounded-3xl border border-white/10 bg-[#12141f] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Emergency Surgery for Rocky"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#181b28] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Target Amount (POL/ETH) *
              </label>
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#181b28] focus-within:border-violet-500">
                <span className="flex items-center border-r border-white/10 px-3 text-xs font-bold text-violet-400">
                  POL
                </span>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="0.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 font-mono"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#181b28] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="Medical">Medical</option>
                <option value="Education">Education</option>
                <option value="Charity">Charity</option>
                <option value="Emergency">Emergency</option>
                <option value="Startup">Startup</option>
                <option value="Community">Community</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Campaign Story */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Story & Details *
              </label>
              <textarea
                rows="5"
                required
                placeholder="Explain the background, reason for fundraising, and how funds will be spent..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#181b28] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {storyCid && (
                <p className="mt-1.5 text-xs font-mono text-emerald-400">
                  ✓ Story saved to IPFS: {storyCid}
                </p>
              )}
            </div>

            {/* Banner Image */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Campaign Banner Image
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="flex flex-1 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-[#181b28] p-4 text-center hover:border-violet-500 transition">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-xs font-semibold text-gray-300">
                    {photo ? photo.name : "Click to select image"}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    PNG, JPG, or WEBP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>

                {photoPreview && (
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {imageCid && (
                <p className="mt-1.5 text-xs font-mono text-emerald-400">
                  ✓ Image uploaded to IPFS: {imageCid}
                </p>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500">
              Contract creates a dedicated smart contract for your campaign.
            </p>

            <div className="flex w-full sm:w-auto gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-violet-600/30 transition hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {statusStep || "Processing..."}
                  </span>
                ) : account ? (
                  "Launch Campaign on Blockchain →"
                ) : (
                  "Connect Wallet to Launch"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default From;
