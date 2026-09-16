import React from "react";
import { NavLink } from "react-router-dom";

const Buttons = () => {
  return (
    <>
      <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `rounded-lg px-2.5 py-2 text-[10px] font-bold ${
              isActive ? "bg-gray-100 text-gray-900" : "text-gray-800"
            }`
          }
        >
          CAMPAIGNS
        </NavLink>

        <NavLink
          to="/create-campaign"
          className={({ isActive }) =>
            `rounded-lg px-2.5 py-2 text-[10px] font-bold ${
              isActive ? "bg-gray-100 text-gray-900" : "text-gray-800"
            }`
          }
        >
          CREATE CAMPAIGN
        </NavLink>

        <NavLink
          to="/my-campaigns"
          className={({ isActive }) =>
            `rounded-lg px-2.5 py-2 text-[10px] font-bold ${
              isActive ? "bg-gray-100 text-gray-900" : "text-gray-800"
            }`
          }
        >
          MY CAMPAIGNS
        </NavLink>
      </div>
    </>
  );
};

export default Buttons;
