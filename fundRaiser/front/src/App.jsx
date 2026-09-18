import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Layout from "./components/layout/Layout";
import Campigns from "./components/pages/Campigns";
import CreateCampaign from "./components/pages/CreateCampaign";
import CampaignDetails from "./components/pages/CampaignDetails";
import MyCampaigns from "./components/pages/MyCampaigns";

/**
 * Main Application Component
 * Wraps the entire application with:
 * 1. Web3Provider - provides wallet connection and blockchain state to all pages
 * 2. BrowserRouter - provides client-side routing
 * 3. Layout - provides the persistent navbar, dark theme styling, and footer
 */
function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Explore All Campaigns */}
            <Route path="/" element={<Campigns />} />
            <Route path="/campaigns" element={<Campigns />} />

            {/* Campaign Details & Donation View */}
            <Route path="/campaign/:address" element={<CampaignDetails />} />

            {/* Create New Campaign */}
            <Route path="/create-campaign" element={<CreateCampaign />} />

            {/* Creator Dashboard & Donation Activity */}
            <Route path="/my-campaigns" element={<MyCampaigns />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;