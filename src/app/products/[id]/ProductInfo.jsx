<div>
  <h1 className="text-2xl font-bold">{product.name}</h1>

  {/* Rating */}
  <div className="flex items-center space-x-2 mt-2">
    <div className="flex text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < roundedRating ? "" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
    <span className="text-sm text-blue-600 hover:underline cursor-pointer">
      {product.reviews?.length || 0} ratings
    </span>
  </div>
</div>;

{
  /* Price */
}
<div className="border-b pb-4">
  <p className="text-3xl font-bold text-amazonOrange">${product.price}</p>
  <p className="text-sm text-gray-600">
    List Price:{" "}
    <span className="line-through">${(product.price * 1.2).toFixed(2)}</span>
  </p>
  <p className="text-green-600 text-sm font-semibold">Save 20%</p>
</div>;
