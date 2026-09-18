import React from "react";
import { NavLink } from "react-router-dom";

const Buttons = () => {
  const getLinkClasses = ({ isActive }) =>
    `rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
      isActive
        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <nav className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 shadow-inner">
      <NavLink to="/" className={getLinkClasses}>
        EXPLORE CAMPAIGNS
      </NavLink>

      <NavLink to="/create-campaign" className={getLinkClasses}>
        + CREATE CAMPAIGN
      </NavLink>

      <NavLink to="/my-campaigns" className={getLinkClasses}>
        MY DASHBOARD
      </NavLink>
    </nav>
  );
};

export default Buttons;
