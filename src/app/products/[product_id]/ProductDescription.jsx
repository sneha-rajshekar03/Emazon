"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ProductDescription({ product, ...props }) {
  return (
    <Card {...props} className="p-6">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="specifications">Specs</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="space-y-4 mt-6">
          <h3>Product Description</h3>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-6">
          <h3>Key Features</h3>
          <div className="grid gap-3"> {product.description}</div>
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4 mt-6">
          <h3>Technical Specifications</h3>
          <div className="grid gap-4">
            {
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-muted-foreground">
                  {" "}
                  {product.description}
                </span>
                <Badge variant="secondary" className="text-xs">
                  meow
                </Badge>
              </div>
            }
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
