"use client";
import React, { useState } from "react";
import Nav from "@/components/Nav";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  return (
    <div>
      <Nav onResults={setProducts} /> {/* ✅ pass setter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {products.map((p) => (
          <div key={p.asin} className="border p-4">
            <img
              src={p.image || "https://via.placeholder.com/150"}
              alt={p.title}
              className="h-40 w-full object-cover mb-2"
            />
            <h3 className="font-bold">{p.title}</h3>
            <p>{p.price?.raw || "Price N/A"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
