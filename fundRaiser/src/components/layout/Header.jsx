import React from "react";
import Walletsection from "./Walletsection";

// import { NavLink } from "react-router-dom";
import Buttons from "./Buttons";
const Header = () => {
  return (
    // <div className="mt-0.5">
    <div className="min-h-screen bg-[#e9e7ff]  ">
      <header className="w-full px-4 py-2.5  ">
        <div className="flex items-center justify-between border-2 border-red-400 p-2 rounded ">
          <h1 className="font-serif text-[22px] font-bold text-black">
            The Saviour
          </h1>
<Buttons/>
          <div className="rounded-xl bg-black p-1 shadow-sm">
            <Walletsection />
          </div>
        </div>
      </header>
    </div>
    // </div>
  );
};

export default Header;
