import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              />
              {user?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 mb-4">{user?.email}</p>
            
            {user?.isVerified && (
              <Badge className="bg-accent/10 text-accent border-accent/20">
                <i className="fas fa-shield-check mr-1"></i>
                Verified
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Identity Verification Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span>Identity Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.isVerified ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Verified Player</h3>
                  <p className="text-sm text-green-700">Your identity has been verified</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            ) : user?.verificationStatus === "pending" ? (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900">Verification Pending</h3>
                  <p className="text-sm text-yellow-700">Your documents are being reviewed</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </div>
            ) : user?.verificationStatus === "rejected" ? (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Verification Required</h3>
                  <p className="text-sm text-red-700">Please resubmit your verification documents</p>
                </div>
                <Button 
                  onClick={() => setLocation("/verify-identity")}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Build Trust</h3>
                    <p className="text-sm text-blue-700">Verify your identity to unlock premium features and build trust with other players</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation("/verify-identity")}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Start Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Preferences</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/preferences")}
            >
              <i className="fas fa-edit mr-2"></i>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.skillLevel && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Skill Level</h4>
                <Badge variant="outline" className="capitalize">
                  {user.skillLevel}
                </Badge>
              </div>
            )}
            
            {user?.sportsInterests && user.sportsInterests.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sports Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {user.sportsInterests.map((sport) => (
                    <Badge key={sport} variant="secondary" className="capitalize">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {user?.searchRadius && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Search Radius</h4>
                <p className="text-gray-600">{user.searchRadius} miles</p>
              </div>
            )}
            
            {user?.genderIdentity && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Gender Identity</h4>
                <p className="text-gray-600 capitalize">{user.genderIdentity.replace('-', ' ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/my-events")}
            >
              <i className="fas fa-calendar mr-3"></i>
              My Events
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation("/preferences")}
            >
              <i className="fas fa-cog mr-3"></i>
              Settings
            </Button>
            
            {!user?.isVerified && (
              <Button 
                variant="outline" 
                className="w-full justify-start border-accent text-accent"
              >
                <i className="fas fa-shield-check mr-3"></i>
                Get Verified
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button 
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Sign Out
        </Button>
      </div>

      <BottomNavigation activePage="profile" />
    </div>
  );
}
