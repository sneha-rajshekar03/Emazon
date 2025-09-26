import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
const relatedProducts = [
  {
    id: 1,
    name: "Premium Wireless Earbuds",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Studio Monitor Headphones",
    price: 299.99,
    rating: 4.9,
  },
  {
    id: 3,
    name: "Gaming Headset Pro",
    price: 159.99,
    originalPrice: 199.99,
    rating: 4.7,
  },
];

export function Random({ product }) {
  return (
    <div className="space-y-6">
      {/* Recently Viewed */}
      <Card className="p-6">
        <h3 className="mb-4">Recently Viewed</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.imgUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Bluetooth Speaker</p>
              <p className="text-sm text-muted-foreground">$89.99</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.imgUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Laptop Stand</p>
              <p className="text-sm text-muted-foreground">$45.99</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Related Products */}
      <Card className="p-6">
        <h3 className="mb-4">You Might Also Like</h3>
        <div className="space-y-4">
          {relatedProducts.map((product) => (
            <div
              key={product.id}
              className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <h4 className="font-medium text-sm">{product.name}</h4>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                  <span className="text-xs text-muted-foreground">
                    {product.rating}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" className="text-xs px-3">
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
