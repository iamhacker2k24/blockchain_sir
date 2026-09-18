import React from "react";
import Buttons from "./Buttons";
import WalletSection from "./Walletsection";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/25">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-white group-hover:text-violet-400 transition">
              The Saviour
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              Web3 Crowdfunding
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <div className="hidden md:block">
          <Buttons />
        </div>

        {/* Wallet & Network Info */}
        <div className="flex items-center gap-3">
          <WalletSection />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden border-t border-white/5 px-4 py-2 bg-[#090b10]">
        <Buttons />
      </div>
    </header>
  );
};

export default Header;
