import Image from "next/image";

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-md bg-white shadow-sm hover:shadow-md transition p-3 flex flex-col w-full">
      <div className="flex justify-center items-center h-40 mb-2">
        <div className="relative w-[180px] h-[180px] overflow-hidden">
          <Image
            src={product.image} // direct URL, no proxy needed
            alt={product.title}
            fill
            quality={40}
            loading="lazy"
            className="object-contain p-3"
          />
        </div>
      </div>
      <h3 className="text-sm font-medium line-clamp-2">{product.title}</h3>
      <p className="text-gray-600 text-xs line-clamp-3">{product.details}</p>
    </div>
  );
};

export default ProductCard;
