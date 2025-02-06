import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const steps = [
  {
    title: "Business Information",
    fields: ["businessName", "businessType", "description"],
  },
  {
    title: "Contact Details",
    fields: ["address", "city", "postalCode", "phone"],
  },
  {
    title: "Legal Information",
    fields: ["registrationNo", "taxId"],
  },
];

export function SellerOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="container max-w-3xl py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Let's get your business set up on our platform
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Form Steps */}
          <Card className="p-6">
            {/* Form content based on currentStep */}
            {/* Add form fields and validation logic */}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  // Handle completion
                }
              }}
            >
              {currentStep === steps.length - 1 ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
