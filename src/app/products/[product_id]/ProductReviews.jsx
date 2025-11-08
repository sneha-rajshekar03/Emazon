"use client";

import { Star, ThumbsUp, MoreVertical, PenLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useColor } from "@/app/context/ColorContext";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Utility functions
const calculateRatingDistribution = (reviews) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    let rating = review.rating;
    if (review.rating?.$numberInt) rating = parseInt(review.rating.$numberInt);
    else if (review.rating?.$numberDouble)
      rating = Math.round(parseFloat(review.rating.$numberDouble));
    if (rating >= 1 && rating <= 5) distribution[rating]++;
  });

  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: distribution[stars],
    percentage: total > 0 ? Math.round((distribution[stars] / total) * 100) : 0,
  }));
};

const calculateAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => {
    let rating = review.rating;
    if (review.rating?.$numberInt) rating = parseInt(review.rating.$numberInt);
    else if (review.rating?.$numberDouble)
      rating = parseFloat(review.rating.$numberDouble);
    return acc + rating;
  }, 0);
  return sum / reviews.length;
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getTimeAgo = () => {
  const timeOptions = [
    "2 weeks ago",
    "1 month ago",
    "3 weeks ago",
    "2 months ago",
    "1 week ago",
  ];
  return timeOptions[Math.floor(Math.random() * timeOptions.length)];
};

export function ProductReviews({ product, ...props }) {
  const { hexColor, isDarkMode } = useColor();
  const { data: session } = useSession();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [reviews, setReviews] = useState(product.reviews || []);
  const [allReviewsLoaded, setAllReviewsLoaded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [productRating, setProductRating] = useState(
    product.stars?.$numberDouble
      ? parseFloat(product.stars.$numberDouble)
      : product.stars || 0
  );

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
    } else if (session?.user?.email) {
      const nameFromEmail = session.user.email.split("@")[0];
      setUserName(nameFromEmail);
    }
  }, [session]);

  useEffect(() => {
    const newAvgRating = calculateAverageRating(reviews);
    setProductRating(newAvgRating);
  }, [reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (rating === 0 || !userName.trim() || !reviewComment.trim()) {
      alert("Please fill in all fields and select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const newReview = {
        user: userName.trim(),
        rating,
        text: reviewComment.trim(),
      };

      const response = await fetch(
        `/api/products/${product.product_id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to submit review");
      }

      const result = await response.json();

      if (result?.reviews) {
        setReviews(result.reviews);
      }
      if (result?.stars) {
        setProductRating(
          result.stars?.$numberDouble
            ? parseFloat(result.stars.$numberDouble)
            : parseFloat(result.stars)
        );
      }

      setRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (allReviewsLoaded || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const skip = reviews.length;
      const limit = 3;
      const response = await fetch(
        `/api/products/${product.product_id}/reviews?skip=${skip}&limit=${limit}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error("Failed to load more reviews");
      const result = await response.json();

      if (result.reviews && result.reviews.length > 0)
        setReviews((prev) => [...prev, ...result.reviews]);
      if (!result.reviews || result.reviews.length < limit)
        setAllReviewsLoaded(true);
      setVisibleReviews((prev) => prev + 3);
    } catch (error) {
      console.error("Error loading more reviews:", error);
      alert("Failed to load more reviews. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getTitleFromRating = (rating) => {
    const titles = {
      5: ["Excellent product!", "Highly recommended!", "Amazing quality!"],
      4: [
        "Good value for money",
        "Pretty good overall",
        "Satisfied with purchase",
      ],
      3: ["It's okay", "Average product", "Meets expectations"],
      2: ["Could be better", "Not what I expected", "Disappointed"],
      1: ["Poor quality", "Not recommended", "Waste of money"],
    };
    const ratingTitles = titles[rating] || titles[3];
    return ratingTitles[Math.floor(Math.random() * ratingTitles.length)];
  };

  const transformedReviews = reviews.map((review, index) => {
    let ratingValue = review.rating;
    if (review.rating?.$numberInt)
      ratingValue = parseInt(review.rating.$numberInt);
    else if (review.rating?.$numberDouble)
      ratingValue = Math.round(parseFloat(review.rating.$numberDouble));

    return {
      id: index + 1,
      author: review.user || "Anonymous",
      rating: ratingValue,
      date: getTimeAgo(),
      title: getTitleFromRating(ratingValue),
      content: review.text || review.comment || "No comment provided",
      helpful: Math.floor(Math.random() * 50),
      verified: Math.random() > 0.3,
    };
  });

  const ratingDistribution = calculateRatingDistribution(reviews);
  const reviewCount = reviews.length;

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
      {/* Subtle color overlay across the box */}
      <div
        style={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${hexColor}08 0%, ${hexColor}15 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 🌈 New top-left glow tint */}
      <div
        style={{
          content: '""',
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "45%",
          height: "45%",
          background: `radial-gradient(circle at top left, ${hexColor}55 0%, transparent 75%)`,
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(12px)",
        }}
      />

      <div className="relative z-10">
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
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="rounded-full px-4 py-2 transition-all flex items-center gap-2 text-white hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f0 100%)`,
            }}
          >
            {showReviewForm ? (
              <>
                <X className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <PenLine className="h-4 w-4" /> Write a Review
              </>
            )}
          </Button>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div
            className="mt-4 p-4 rounded-lg"
            style={{
              background: isDarkMode
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(16, 185, 129, 0.1)",
              border: `1px solid ${
                isDarkMode
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(16, 185, 129, 0.3)"
              }`,
              color: isDarkMode ? "#34d399" : "#059669",
            }}
          >
            ✓ Review submitted successfully!
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div
            className="mt-6 p-6 rounded-2xl border"
            style={{
              background: isDarkMode
                ? "rgba(55, 55, 55, 0.5)"
                : "rgba(249, 250, 251, 0.5)",
              backdropFilter: "blur(8px)",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <h4
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Write Your Review
            </h4>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Name Input */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  readOnly={!!session?.user?.name}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-900/50 border-gray-600/50 text-gray-100 placeholder-gray-500 focus:border-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                  } ${
                    session?.user?.name ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Rating */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                          i < (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : isDarkMode
                            ? "text-gray-600"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-all resize-none ${
                    isDarkMode
                      ? "bg-gray-900/50 border-gray-600/50 text-gray-100 placeholder-gray-500 focus:border-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                  }`}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full py-3 font-medium transition-all text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f0 100%)`,
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </div>
        )}

        {/* Rating Summary */}
        <div className="grid md:grid-cols-2 gap-10 py-8">
          <div className="text-center">
            <div
              className={`text-5xl font-bold ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {productRating.toFixed(1)}
            </div>
            <div className="flex justify-center gap-1 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(productRating)
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
              Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
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
        {transformedReviews.length > 0 ? (
          <div className="space-y-8">
            {transformedReviews.slice(0, visibleReviews).map((review) => (
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
                        {getInitials(review.author)}
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
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: isDarkMode
                                ? "rgba(16, 185, 129, 0.2)"
                                : "rgba(16, 185, 129, 0.1)",
                              color: isDarkMode ? "#34d399" : "#059669",
                            }}
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
        ) : (
          <div
            className={`text-center py-12 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}

        {/* Load More Button */}
        {transformedReviews.length > 0 &&
          visibleReviews < transformedReviews.length &&
          !allReviewsLoaded && (
            <div className="pt-8">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={`w-full font-medium rounded-full py-3 transition-all ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoadingMore
                  ? "Loading..."
                  : `Load More Reviews (${
                      transformedReviews.length - visibleReviews
                    } remaining)`}
              </Button>
            </div>
          )}

        {/* End of Reviews */}
        {allReviewsLoaded &&
          transformedReviews.length > 0 &&
          visibleReviews >= transformedReviews.length && (
            <div
              className={`text-center py-8 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <p>End of reviews</p>
            </div>
          )}
      </div>
    </div>
  );
}
