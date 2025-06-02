import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Upload, Calendar, Users, Crown } from "lucide-react";

interface PremiumPathwayPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    hasCompletedVerification?: boolean;
    hasCreatedEvent?: boolean;
    hasJoinedEvent?: boolean;
    userTier?: string;
    repPoints?: number;
  };
}

export default function PremiumPathwayPopup({ isOpen, onClose, user }: PremiumPathwayPopupProps) {
  const steps = [
    {
      id: 'verification',
      title: 'Submit Identity Verification',
      description: 'Upload selfie and government ID for community safety',
      icon: Upload,
      completed: user.hasCompletedVerification,
      points: 50,
      action: 'Upload Documents'
    },
    {
      id: 'create',
      title: 'Create an Event',
      description: 'Host your first sports event and build community',
      icon: Calendar,
      completed: user.hasCreatedEvent,
      points: 15,
      action: 'Create Event'
    },
    {
      id: 'join',
      title: 'Join an Event',
      description: 'Connect with others by joining a sports event',
      icon: Users,
      completed: user.hasJoinedEvent,
      points: 5,
      action: 'Browse Events'
    }
  ];

  const totalPoints = steps.reduce((sum, step) => sum + (step.completed ? step.points : 0), 0);
  const maxPoints = steps.reduce((sum, step) => sum + step.points, 0);
  const allCompleted = steps.every(step => step.completed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {allCompleted ? 'Welcome to Premium!' : 'Unlock Premium Access'}
          </DialogTitle>
          <p className="text-gray-600 text-sm">
            {allCompleted 
              ? 'You\'ve completed all requirements and unlocked premium features!'
              : 'Complete these 3 steps to unlock premium features and full platform access'
            }
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={step.id} className={`transition-all ${step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-100' : 'bg-white border-2 border-gray-200'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <IconComponent className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-sm ${step.completed ? 'text-green-800' : 'text-gray-900'}`}>
                          {step.title}
                        </h3>
                        <Badge variant={step.completed ? "default" : "secondary"} className="text-xs">
                          +{step.points} points
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                      {!step.completed && (
                        <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700">
                          {step.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPoints}/{maxPoints}</div>
          <div className="text-sm text-gray-600">Rep Points Earned</div>
          {allCompleted && (
            <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              Premium Unlocked!
            </Badge>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            {allCompleted ? 'Continue' : 'Later'}
          </Button>
          {!allCompleted && (
            <Button 
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Get Started
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}