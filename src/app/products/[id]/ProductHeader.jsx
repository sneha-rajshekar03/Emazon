export function ProductHeader({ product }) {
  return (
    <div className="border-b pb-4">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-600">{product.brand}</p>
    </div>
  );
}
