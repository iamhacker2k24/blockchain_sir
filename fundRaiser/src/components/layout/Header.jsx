
import React from "react";
import Walletsection from "./Walletsection";

const Header = () => {
  return (
    // <div className="mt-0.5">
      <div className="min-h-screen bg-[#e9e7ff]  ">
        <header className="w-full px-4 py-2.5  ">
          <div className="flex items-center justify-between border-2 border-red-400 p-2 rounded ">
   
            <h1 className="font-serif text-[22px] font-bold text-black">
              The Saviour
            </h1>


      
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
              <button className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100">
                CAMPAIGNS
              </button>

              <button className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100">
                CREATE CAMPAIGN
              </button>

              <button className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100">
                DASHBOARD
              </button>
            </div>

            <div className="rounded-xl bg-black p-1 shadow-sm">
               {/* <button className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-white ">
                WALLETE
              </button> */}
              <Walletsection/>
            </div>
          </div>
        </header>
      </div>
    // </div>
  );
};

export default Header;
