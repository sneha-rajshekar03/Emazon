export function ProductReviews({ product }) {
  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Customer Reviews</h2>
      <p className="mb-4">⭐ {avgRating.toFixed(1)} out of 5</p>
      {product.reviews?.map((r, idx) => (
        <div key={idx} className="border-b py-2">
          <p className="font-semibold">{r.user}</p>
          <p>⭐ {r.rating}</p>
          <p className="text-gray-600">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}
