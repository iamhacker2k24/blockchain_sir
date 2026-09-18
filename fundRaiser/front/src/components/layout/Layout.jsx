import React from "react";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Top Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6">
        {children}
      </main>

      {/* Modern Web3 Footer */}
      <footer className="border-t border-white/5 bg-[#07080c] py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} The Saviour • Web3 Crowdfunding Platform</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Powered by Solidity & Hardhat 3</span>
            <span>•</span>
            <span>Polygon Amoy Testnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;