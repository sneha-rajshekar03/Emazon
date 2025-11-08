"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useColor } from "@/app/context/ColorContext";

export function ProductDescription({ product, ...props }) {
  const { hexColor, isDarkMode } = useColor();

  return (
    <div
      {...props}
      className="relative p-8 rounded-3xl border transition-all duration-500"
      style={{
        background: isDarkMode
          ? "rgba(45, 45, 45, 0.6)"
          : "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: isDarkMode
          ? "1px solid rgba(255, 255, 255, 0.1)"
          : "1px solid rgba(255, 255, 255, 0.6)",
        borderRadius: "28px",
        boxShadow: isDarkMode
          ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
          : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isDarkMode
          ? `0 15px 30px rgba(0, 0, 0, 0.5)`
          : `0 15px 30px rgba(0, 0, 0, 0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isDarkMode
          ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
          : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`;
      }}
    >
      {/* Lighter color tint overlay */}
      <div
        style={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${hexColor}05 0%, ${hexColor}0a 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Color tint in bottom-left corner */}
      <div
        style={{
          content: '""',
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "45%",
          height: "45%",
          background: `radial-gradient(circle at bottom left, ${hexColor}35 0%, transparent 75%)`,
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(12px)",
        }}
      />

      <div className="relative z-10">
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
                      isDarkMode
                        ? "hover:bg-gray-800/60"
                        : "hover:bg-gray-50/60"
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
      </div>
    </div>
  );
}
