import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

export default function Landing() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLogin = () => {
    if (acceptedTerms) {
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <i className="fas fa-basketball-ball text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-baller text-gray-900 mb-2">Baller</h1>
            <p className="text-lg text-gray-600">Find your perfect game</p>
          </div>
        </div>

        {/* Features */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-heart text-primary"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Swipe to Discover</h3>
                  <p className="text-sm text-gray-600">Find events that match your interests</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-users text-accent"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect & Play</h3>
                  <p className="text-sm text-gray-600">Join sports events in your area</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-calendar text-secondary"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Host Events</h3>
                  <p className="text-sm text-gray-600">Create and manage your own games</p>
                </div>
              </div>
            </div>
            
            {/* Terms of Use Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
              <Checkbox 
                id="terms-checkbox"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-0.5"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="/terms-of-use" className="text-primary underline hover:text-primary/80">
                  Terms of Use
                </Link>
                {" "}and acknowledge that I understand the risks associated with sports activities.
              </label>
            </div>
            
            <Button 
              onClick={handleLogin}
              disabled={!acceptedTerms}
              className={`w-full h-12 font-semibold rounded-xl transition-all ${
                acceptedTerms 
                  ? 'bg-primary hover:bg-primary/90 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Get Started
            </Button>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              Join thousands of athletes finding their next game
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
