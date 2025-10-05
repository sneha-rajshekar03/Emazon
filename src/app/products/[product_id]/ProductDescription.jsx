"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useColor } from "@app/context/ColorContext";

export function ProductDescription({ product, ...props }) {
  const { isDarkMode } = useColor();

  return (
    <Card
      {...props}
      className={`
        p-8 rounded-3xl 
        backdrop-blur-xl 
        border 
        transition-all duration-500
        ${
          isDarkMode
            ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        }
      `}
    >
      <Tabs defaultValue="description" className="w-full">
        <TabsList
          className={`
            grid w-full grid-cols-3 
            backdrop-blur-md 
            rounded-2xl p-1 
            shadow-inner
            ${isDarkMode ? "bg-gray-800/50" : "bg-gray-50/50"}
          `}
        >
          {["description", "features", "specifications"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`
                font-medium rounded-xl
                transition-all duration-300 ease-in-out
                data-[state=active]:shadow-sm
                ${
                  isDarkMode
                    ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                    : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black"
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Description */}
        <TabsContent value="description" className="mt-8 space-y-5">
          <h3
            className={`text-xl font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Product Description
          </h3>
          <p
            className={`leading-relaxed tracking-wide ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {product.description ||
              "A premium product designed with precision and simplicity in mind."}
          </p>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="mt-8 space-y-5">
          <h3
            className={`text-xl font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Key Features
          </h3>
          <ul
            className={`space-y-2 list-disc list-inside ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {product.features ? (
              product.features.map((feature, i) => <li key={i}>{feature}</li>)
            ) : (
              <li>Lightweight and durable design</li>
            )}
          </ul>
        </TabsContent>

        {/* Specifications */}
        <TabsContent value="specifications" className="mt-8 space-y-5">
          <h3
            className={`text-xl font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Technical Specifications
          </h3>
          <div
            className={`divide-y ${
              isDarkMode ? "divide-gray-800" : "divide-gray-100"
            }`}
          >
            {product.specs ? (
              product.specs.map((spec, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center py-3 rounded-lg transition-colors ${
                    isDarkMode ? "hover:bg-gray-800/60" : "hover:bg-gray-50/60"
                  }`}
                >
                  <span
                    className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                  >
                    {spec.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-medium ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {spec.value}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center py-3">
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                >
                  Battery Life
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-200"
                      : "bg-gray-100 text-gray-800"
                  }`}
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
