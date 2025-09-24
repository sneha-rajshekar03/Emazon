export function ProductDescription({ product }) {
  return (
    <div className="border-t pt-6">
      <h2 className="text-xl font-semibold mb-3">About this item</h2>

      {/* If features exist, show them as list */}
      {product.features && product.features.length > 0 ? (
        <ul className="list-disc pl-6 space-y-2 text-gray-800 text-sm leading-relaxed">
          {product.features.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>
      ) : (
        // fallback if no features in JSON
        <p className="text-gray-600 text-sm">
          {product.description || "No additional information available."}
        </p>
      )}
    </div>
  );
}
