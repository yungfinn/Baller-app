import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Grid3X3, RotateCcw, MapPin } from "lucide-react";
import SwipeView from "@/components/swipe-view";
import GridView from "@/components/grid-view";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe");
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events", { 
      sport: sportFilter !== "all" ? sportFilter : undefined,
      skill: skillFilter !== "all" ? skillFilter : undefined,
      search: searchQuery || undefined
    }],
  });

  const { data: userRsvps = [] } = useQuery({
    queryKey: ["/api/user/rsvps"],
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
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">Filter</span>
              </button>
              <button 
                onClick={() => setViewMode(viewMode === "swipe" ? "grid" : "swipe")}
                className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 transition-colors"
              >
                {viewMode === "swipe" ? (
                  <>
                    <Grid3X3 className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Grid</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Swipe</span>
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

      {/* Search and Enhanced Filters */}
      <section className="bg-white border-b border-gray-100 pb-4">
        <div className="max-w-md mx-auto px-4 pt-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Quick Sport Filters */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 mb-3">
            {["all", "basketball", "soccer", "tennis", "volleyball"].map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  sportFilter === sport
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            ))}
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Skill Level</label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Distance</label>
                  <Select value="all" onValueChange={() => {}}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Within..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Clear Filters */}
              {(sportFilter !== "all" || skillFilter !== "all" || searchQuery) && (
                <Button
                  onClick={() => {
                    setSportFilter("all");
                    setSkillFilter("all");
                    setSearchQuery("");
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full h-8"
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
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
          <SwipeView 
            events={events} 
            userRsvps={userRsvps}
            currentUserId={user?.id}
          />
        ) : (
          <GridView 
            events={events}
            userRsvps={userRsvps}
            currentUserId={user?.id}
          />
        )}
      </main>



      {/* Bottom Navigation */}
      <BottomNavigation activePage="discover" />
    </div>
  );
}
