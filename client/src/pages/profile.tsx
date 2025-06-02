import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, Trophy, Star, Users, Calendar, AlertCircle, Settings } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: hostedEvents = [] } = useQuery({
    queryKey: ["/api/events/host", (user as any)?.id],
    enabled: !!(user as any)?.id,
  });

  const { data: userRsvps = [] } = useQuery({
    queryKey: ["/api/user/rsvps"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'pro':
        return { name: 'Pro', color: 'bg-purple-500', icon: Trophy, points: '1000+' };
      case 'premium':
        return { name: 'Premium', color: 'bg-blue-500', icon: Star, points: '250-999' };
      default:
        return { name: 'Free', color: 'bg-gray-500', icon: Users, points: '0-249' };
    }
  };

  const getProgressToNextTier = (repPoints: number) => {
    if (repPoints < 250) {
      return { nextTier: 'Premium', needed: 250 - repPoints, progress: (repPoints / 250) * 100 };
    } else if (repPoints < 1000) {
      return { nextTier: 'Pro', needed: 1000 - repPoints, progress: ((repPoints - 250) / 750) * 100 };
    }
    return { nextTier: 'Max Level', needed: 0, progress: 100 };
  };

  const currentTier = (user as any)?.tier || 'free';
  const currentRepPoints = (userStats as any)?.repPoints || 0;
  const tierInfo = getTierInfo(currentTier);
  const TierIcon = tierInfo.icon;
  const progress = getProgressToNextTier(currentRepPoints);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/")} className="text-gray-600">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="text-center pt-6">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <img 
                src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {(user as any)?.firstName && (user as any)?.lastName 
                ? `${(user as any).firstName} ${(user as any).lastName}` 
                : 'Your Name'}
            </h2>
            <p className="text-gray-600 mb-4">{(user as any)?.email || 'your.email@example.com'}</p>
            
            {/* Rep Points & Tier Display */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TierIcon className="w-5 h-5" />
                  <span className="font-semibold">{tierInfo.name} Tier</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{currentRepPoints}</div>
                  <div className="text-xs opacity-90">Rep Points</div>
                </div>
              </div>
              
              {/* Progress to Next Tier */}
              {progress.nextTier !== 'Max Level' ? (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress to {progress.nextTier}</span>
                    <span>{progress.needed} points needed</span>
                  </div>
                  <Progress value={progress.progress} className="h-2 bg-white/20" />
                </div>
              ) : (
                <div className="text-center text-sm">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Maximum tier reached!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Activity Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Array.isArray(hostedEvents) ? hostedEvents.length : 0}</div>
                <div className="text-sm text-gray-600">Events Hosted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Array.isArray(userRsvps) ? userRsvps.length : 0}</div>
                <div className="text-sm text-gray-600">Events Joined</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rep Points History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>How to Earn Rep Points</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Create an event</span>
              <Badge variant="secondary">+15 points</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Join an event</span>
              <Badge variant="secondary">+5 points</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Complete identity verification</span>
              <Badge variant="secondary">+50 points</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/preferences")}
            >
              <Users className="w-4 h-4 mr-2" />
              Edit Preferences
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/verify-identity")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Identity Verification
            </Button>

            {/* Admin Panel Access - Only for admin users */}
            {(user as any)?.email === 'theyungfinn@gmail.com' && (
              <Button 
                variant="outline" 
                className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setLocation("/admin-panel")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/terms-of-use")}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Terms of Use
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation activePage="profile" />
    </div>
  );
}