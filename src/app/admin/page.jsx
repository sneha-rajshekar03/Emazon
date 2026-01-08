// app/admin/page.jsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getAllAnalytics } from "@/lib/analytics";
import {
  InteractionChart,
  SearchCategoriesChart,
  PaymentMethodChart,
} from "@/app/admin/AnalyticsCharts";
import { Suspense } from "react";
import LogoutButton from "@/app/admin/LogoutButton";
import Script from "next/script";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function AnalyticsDashboard() {
  let analytics;

  try {
    analytics = await getAllAnalytics();
    console.log("✅ [ADMIN PAGE] Analytics loaded successfully");
  } catch (error) {
    console.error("❌ [ADMIN PAGE] Failed to load analytics:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-sm text-red-700">
          {error.message || "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  const users = analytics?.users || {
    totalUsers: 0,
    adminCount: 0,
    regularUsers: 0,
    weeklyGrowth: 0,
  };

  const searchHistory = analytics?.searchHistory || {
    totalSearches: 0,
    uniqueQueries: 0,
    avgResultsPerSearch: 0,
    topCategories: [],
  };

  const purchases = analytics?.purchases || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    repeatRate: 0,
  };

  const preferences = analytics?.preferences || [];
  const payments = analytics?.payments || {
    distribution: [],
    fallbackRate: 0,
    totalPredictions: 0,
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={users.totalUsers.toLocaleString()}
          subtitle={`${users.adminCount} admins, ${users.regularUsers} users`}
          trend={`+${users.weeklyGrowth} this week`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Searches"
          value={searchHistory.totalSearches.toLocaleString()}
          subtitle={`${searchHistory.uniqueQueries} unique queries`}
          trend={`${searchHistory.avgResultsPerSearch} avg results`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Revenue"
          value={`$${(purchases.totalRevenue / 1000).toFixed(1)}K`}
          subtitle={`${purchases.totalOrders.toLocaleString()} orders`}
          trend={`$${purchases.avgOrderValue} avg`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Repeat Rate"
          value={`${purchases.repeatRate}%`}
          subtitle="Customer retention"
          trend="Loyalty metric"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {preferences.length > 0 ? (
          <InteractionChart data={preferences} />
        ) : (
          <EmptyChartPlaceholder
            title="User Preferences"
            message="No preference data available yet"
          />
        )}

        {searchHistory.topCategories.length > 0 ? (
          <SearchCategoriesChart data={searchHistory.topCategories} />
        ) : (
          <EmptyChartPlaceholder
            title="Search Categories"
            message="No search data available yet"
          />
        )}
      </div>

      {/* Payment Method Chart */}
      <div className="mb-6">
        {payments.totalPredictions > 0 ? (
          <PaymentMethodChart data={payments} />
        ) : (
          <EmptyChartPlaceholder
            title="Payment Methods"
            message="No payment data available yet"
          />
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-gray-200">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Privacy-First Analytics
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              All data shown is aggregated across users. No personal
              information, emails, or identifiable data is displayed. This
              dashboard respects user privacy while providing actionable
              business insights.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last updated:{" "}
              {analytics?.lastUpdated
                ? new Date(analytics.lastUpdated).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyChartPlaceholder({ title, message }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[340px]">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-200">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">{message}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend, icon }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-200">
          <div className="text-gray-600">{icon}</div>
        </div>
        {trend && (
          <div className="bg-gray-50 rounded-md px-2 py-1 border border-gray-200">
            <span className="text-xs font-medium text-gray-600">{trend}</span>
          </div>
        )}
      </div>

      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-3xl font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg h-40 border border-gray-200"
          />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl h-[420px] border border-gray-200" />
        <div className="bg-white rounded-xl h-[420px] border border-gray-200" />
      </div>

      {/* Payment Chart Skeleton */}
      <div className="bg-white rounded-xl h-[420px] border border-gray-200" />
    </div>
  );
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Popup Blocker Script */}
      <Script
        id="popup-blocker"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Block all alert, confirm, and prompt dialogs
              window.alert = function() { console.log('Alert blocked'); };
              window.confirm = function() { console.log('Confirm blocked'); return false; };
              window.prompt = function() { console.log('Prompt blocked'); return null; };
              
              // Block window.open popups
              const originalOpen = window.open;
              window.open = function() {
                console.log('Popup blocked');
                return null;
              };
              
              // Block popups from links with target="_blank"
              document.addEventListener('click', function(e) {
                const target = e.target.closest('a');
                if (target && target.target === '_blank') {
                  const href = target.href;
                  // Allow if it's same origin or explicitly allowed domains
                  if (href && !href.startsWith(window.location.origin)) {
                    e.preventDefault();
                    console.log('External popup blocked:', href);
                  }
                }
              }, true);
              
              // Prevent beforeunload popups
              window.addEventListener('beforeunload', function(e) {
                delete e.returnValue;
              });
              
              console.log('🛡️ Popup blocker initialized');
            })();
          `,
        }}
      />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6">
            {/* Top Row - Logo and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                  <span className="text-xs font-medium text-gray-700">
                    Admin Access
                  </span>
                </div>
                <LogoutButton />
              </div>
            </div>

            {/* Bottom Row - Title and Description */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">
                Analytics Dashboard
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <p className="text-base text-gray-600">
                  Privacy-first insights and real-time metrics
                </p>
                <span className="hidden sm:inline text-gray-300">•</span>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  );
}
