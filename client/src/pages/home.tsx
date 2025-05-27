import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import SwipeView from "@/components/swipe-view";
import GridView from "@/components/grid-view";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events", { sport: activeFilter !== "all" ? activeFilter : undefined, view: viewMode }],
  });

  // Check if user needs to set preferences
  const needsPreferences = user && (!user.sportsInterests || !user.skillLevel);

  if (needsPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto">
            <i className="fas fa-cog text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SportMate!</h2>
            <p className="text-gray-600 mb-6">Let's set up your preferences to find the perfect games for you.</p>
            <Button 
              onClick={() => setLocation("/preferences")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
            >
              Set Up Preferences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sportFilters = [
    { key: "all", label: "All Sports" },
    { key: "basketball", label: "Basketball" },
    { key: "soccer", label: "Soccer" },
    { key: "tennis", label: "Tennis" },
    { key: "volleyball", label: "Volleyball" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <i className="fas fa-basketball-ball text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-baller text-gray-900">Baller</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setViewMode(viewMode === "swipe" ? "grid" : "swipe")}
                className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 transition-colors"
              >
                {viewMode === "swipe" ? (
                  <>
                    <i className="fas fa-th-large text-gray-600 text-sm"></i>
                    <i className="fas fa-layer-group text-primary text-sm"></i>
                  </>
                ) : (
                  <>
                    <i className="fas fa-layer-group text-gray-600 text-sm"></i>
                    <i className="fas fa-th-large text-primary text-sm"></i>
                  </>
                )}
              </button>
              
              <button onClick={() => setLocation("/profile")} className="relative">
                <img 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-accent"
                />
                {user?.isVerified && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 pb-4">
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {sportFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <i className="fas fa-futbol text-gray-400 text-xl"></i>
            </div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : viewMode === "swipe" ? (
          <SwipeView events={events} />
        ) : (
          <GridView events={events} />
        )}
      </main>



      {/* Bottom Navigation */}
      <BottomNavigation activePage="discover" />
    </div>
  );
}
