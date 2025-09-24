export function BuyBox({ product }) {
  return (
    <div className="border rounded-lg p-4 shadow-md">
      <p className="text-2xl font-bold text-green-600">₹{product.price}</p>
      <p className="text-gray-500">Inclusive of all taxes</p>

      <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 rounded-lg py-2 font-semibold">
        Add to Cart
      </button>
      <button className="mt-2 w-full bg-orange-500 hover:bg-orange-600 rounded-lg py-2 text-white font-semibold">
        Buy Now
      </button>
    </div>
  );
}
