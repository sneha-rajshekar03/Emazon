"use client";

import { useEffect, useState } from "react";
import { getPrioritizedInteractions } from "@app/utils/interactionTracker";
export default function DebugInteractionsPage() {
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    // Get latest scores when page loads
    setInteractions(getPrioritizedInteractions());

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Interaction Debug</h1>

      {interactions.length === 0 ? (
        <p className="text-gray-500">No interactions yet...</p>
      ) : (
        <ul className="space-y-2">
          {interactions.map(({ element, score }) => (
            <li
              key={element}
              className="p-3 rounded-md border bg-gray-50 flex justify-between"
            >
              <span className="font-medium">{element}</span>
              <span className="text-blue-600 font-semibold">{score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
