import React from "react";

export const SearchBar = () => {
  return (
    <div className="flex w-full">
      <input
        type="text"
        placeholder="Search Amazon"
        className="flex-1 p-3 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <button className=" bg-amber-500 px-4 py-3 rounded-r-md hover:bg-amber-600 active:bg-yellow-600 transition-colors">
        🔍
      </button>
    </div>
  );
};
