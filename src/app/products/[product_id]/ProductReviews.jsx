"use client";

import { Star, ThumbsUp, MoreVertical, PenLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useColor } from "@app/context/ColorContext";

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
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-4 border-b ${
          isDarkMode ? "border-gray-700/40" : "border-gray-200/40"
        }`}
      >
        <h3
          className={`text-2xl font-semibold tracking-tight ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Customer Reviews
        </h3>
        <Button
          className={`rounded-full px-4 py-2 transition-all flex items-center gap-2 ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          } hover:opacity-80`}
        >
          <PenLine className="h-4 w-4" /> Write a Review
        </Button>
      </div>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-10 py-8">
        <div className="text-center">
          <div
            className={`text-5xl font-bold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {product.rating}
          </div>
          <div className="flex justify-center gap-1 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : isDarkMode
                    ? "text-gray-600"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Based on {product.reviewCount} verified reviews
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div
              key={item.stars}
              className={`flex items-center gap-3 text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="w-8">{item.stars}★</span>
              <Progress
                value={item.percentage}
                className={`flex-1 h-2 ${
                  isDarkMode ? "bg-gray-700/60" : "bg-gray-200/60"
                }`}
              />
              <span
                className={`w-8 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-8">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className={`border-b pb-6 last:border-b-0 transition-all ${
              isDarkMode ? "border-gray-700/70" : "border-gray-100/70"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar
                  className={`h-10 w-10 border ${
                    isDarkMode ? "border-gray-600/40" : "border-gray-300/40"
                  }`}
                >
                  <AvatarFallback
                    className={`font-medium ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {review.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {review.author}
                    </span>
                    {review.verified && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDarkMode
                            ? "bg-green-900/40 text-green-400"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : isDarkMode
                              ? "text-gray-600"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${
                  isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <MoreVertical
                  className={`h-4 w-4 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
              </Button>
            </div>

            <h4
              className={`font-semibold mb-2 tracking-tight ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {review.title}
            </h4>
            <p
              className={`leading-relaxed ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {review.content}
            </p>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 flex items-center gap-2 rounded-full ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful ({review.helpful})
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8">
        <Button
          className={`w-full font-medium rounded-full py-3 transition-all ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          Load More Reviews
        </Button>
      </div>
    </Card>
  );
}
