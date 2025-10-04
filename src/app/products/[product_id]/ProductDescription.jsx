"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ProductDescription({ product, ...props }) {
  return (
    <Card
      {...props}
      className="
        p-8 rounded-3xl 
        bg-white/70 backdrop-blur-xl 
        shadow-[0_8px_30px_rgba(0,0,0,0.05)] 
        border border-gray-100/50 
        transition-all duration-500
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]
      "
    >
      <Tabs defaultValue="description" className="w-full">
        <TabsList
          className="
            grid w-full grid-cols-3 
            bg-gray-50/50 backdrop-blur-md 
            rounded-2xl p-1 
            shadow-inner
          "
        >
          {["description", "features", "specifications"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="
                text-gray-600 font-medium rounded-xl
                data-[state=active]:bg-white data-[state=active]:text-black
                transition-all duration-300 ease-in-out
                data-[state=active]:shadow-sm
              "
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Description */}
        <TabsContent value="description" className="mt-8 space-y-5">
          <h3 className="text-xl font-semibold text-gray-900">
            Product Description
          </h3>
          <p className="text-gray-600 leading-relaxed tracking-wide">
            {product.description ||
              "A premium product designed with precision and simplicity in mind."}
          </p>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="mt-8 space-y-5">
          <h3 className="text-xl font-semibold text-gray-900">Key Features</h3>
          <ul className="space-y-2 list-disc list-inside text-gray-600">
            {product.features ? (
              product.features.map((feature, i) => <li key={i}>{feature}</li>)
            ) : (
              <li>Lightweight and durable design</li>
            )}
          </ul>
        </TabsContent>

        {/* Specifications */}
        <TabsContent value="specifications" className="mt-8 space-y-5">
          <h3 className="text-xl font-semibold text-gray-900">
            Technical Specifications
          </h3>
          <div className="divide-y divide-gray-100">
            {product.specs ? (
              product.specs.map((spec, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 hover:bg-gray-50/60 rounded-lg transition-colors"
                >
                  <span className="text-gray-500">{spec.label}</span>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {spec.value}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500">Battery Life</span>
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-gray-100 text-gray-800"
                >
                  20 Hours
                </Badge>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
