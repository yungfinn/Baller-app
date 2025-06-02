import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function EventCreated() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Created!</h1>
          <p className="text-gray-600">
            Your event has been successfully created and is now live for others to discover.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/my-events")}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            View My Events
          </Button>
          
          <Button 
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}