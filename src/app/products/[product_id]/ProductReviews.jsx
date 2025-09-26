"use client";

import { Star, ThumbsUp, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockReviews = [
  {
    id: 1,
    author: "Sarah Johnson",
    rating: 5,
    date: "2 weeks ago",
    title: "Excellent sound quality!",
    content:
      "These headphones exceeded my expectations. The bass is incredible and the noise cancellation works perfectly. Highly recommended!",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: "Mike Chen",
    rating: 4,
    date: "1 month ago",
    title: "Good value for money",
    content:
      "Overall very satisfied with the purchase. The build quality is solid and they're comfortable for long listening sessions.",
    helpful: 18,
    verified: true,
  },
  {
    id: 3,
    author: "Emily Davis",
    rating: 5,
    date: "3 weeks ago",
    title: "Perfect for work from home",
    content:
      "The noise cancellation is a game-changer for video calls. Battery life is excellent too - easily lasts a full day.",
    helpful: 31,
    verified: false,
  },
];

const ratingDistribution = [
  { stars: 5, count: 45, percentage: 65 },
  { stars: 4, count: 18, percentage: 26 },
  { stars: 3, count: 4, percentage: 6 },
  { stars: 2, count: 1, percentage: 1 },
  { stars: 1, count: 1, percentage: 1 },
];

export function ProductReviews({ product, ...props }) {
  return (
    <Card {...props} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3>Customer Reviews</h3>
        <Button variant="outline" size="sm">
          Write a Review
        </Button>
      </div>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold">{product.rating}</div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(product.rating)
                    ? "fill-orange-400 text-orange-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {product.reviewCount} reviews
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3 text-sm">
              <span className="w-8">{item.stars}★</span>
              <Progress value={item.percentage} className="flex-1 h-2" />
              <span className="w-8 text-muted-foreground">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-gray-100 pb-6 last:border-b-0"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {review.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.author}</span>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? "fill-orange-400 text-orange-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <h4 className="font-medium mb-2">{review.title}</h4>
            <p className="text-muted-foreground mb-3">{review.content}</p>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="h-8">
                <ThumbsUp className="mr-1 h-3 w-3" />
                Helpful ({review.helpful})
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full">
        Load More Reviews
      </Button>
    </Card>
  );
}
