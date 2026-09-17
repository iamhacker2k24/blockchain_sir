import React, { useState } from "react";
import axios from "axios";
const From = () => {
  const [camaignTittle, setCampaignTittle] = useState("");
  const [number, setNumber] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState("");
  const [imageCid, setImageCid] = useState("");
  const [storyCid, setStoryCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async () => {
    try {
      if (!photo && !story.trim()) {
        alert("Please select an image or write a story first");
        return;
      }

      setIsUploading(true);

      // Create FormData
      const formData = new FormData();

      // Add the selected image if present
      if (photo) {
        formData.append("photo", photo);
      }

      // Add the story text if present
      if (story.trim()) {
        formData.append("story", story);
      }

      // Send to backend
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || data.msg || "Upload failed");
      }

      if (data.imageCid) {
        setImageCid(data.imageCid);
        console.log("Image CID:", data.imageCid);
      }

      if (data.storyCid) {
        setStoryCid(data.storyCid);
        console.log("Story CID:", data.storyCid);
      }

      let successMsg = "Uploaded successfully to IPFS!";
      if (data.imageCid) successMsg += `\n• Image CID: ${data.imageCid}`;
      if (data.storyCid) successMsg += `\n• Story CID: ${data.storyCid}`;

      alert(successMsg);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  // sendData();
  console.log(camaignTittle, number, story, category, photo);
  return (
    <>
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#0a0a0a] px-4 py-6 text-white">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Create Campaign
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Share your story and start raising funds from your community.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Campaign Title
                </label>
                <input
                  type="text"
                  placeholder="Write your campaign title"
                  className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  onChange={(e) => {
                    setCampaignTittle(e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Required Amount
                </label>

                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#181818] focus-within:border-violet-500">
                  <span className="flex items-center border-r border-white/10 px-3 text-sm text-violet-400">
                    ETH
                  </span>

                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    onChange={(e) => {
                      setNumber(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Story
                </label>

                <textarea
                  rows="4"
                  placeholder="Describe your campaign and explain why you need support..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  onChange={(e) => {
                    setStory(e.target.value);
                  }}
                />
                {storyCid && (
                  <p className="mt-1.5 text-xs text-emerald-400 font-mono">
                    ✓ Story stored on IPFS: {storyCid}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Choose Category
                </label>

                <select
                  className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  onChange={(e) => {
                    setCategory(e.target.value);
                  }}
                >
                  <option value="">Select category</option>
                  <option value="medical">Medical</option>
                  <option value="education">Education</option>
                  <option value="charity">Charity</option>
                  <option value="emergency">Emergency</option>
                  <option value="startup">Startup</option>
                  <option value="community">Community</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Campaign Image
                </label>

                <div className="flex h-[46px] items-center rounded-xl border border-dashed border-white/20 bg-[#181818] px-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="w-full cursor-pointer text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-violet-500"
                    onChange={(e) => {
                      setPhoto(e.target.files[0]);
                    }}
                  />
                </div>
                {imageCid && (
                  <p className="mt-1.5 text-xs text-emerald-400 font-mono">
                    ✓ Image stored on IPFS: {imageCid}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-xs text-gray-500">
                  Your campaign data will be stored on IPFS.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isUploading}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  onClick={uploadFiles}
                >
                  {isUploading ? "Uploading to IPFS..." : "Upload to IPFS"}
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98]"
                >
                  Start Campaign →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default From;
