import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {  TUNISIA_GOVERNORATES, BusinessType, Governorate, BUSINESS_TYPES } from "@/config/constants";
import api from "@/lib/axios";
import MapPicker from '@/components/map-picker';

interface OnboardingFormData {
  businessName: string;
  businessType: BusinessType | "";
  description: string;
  address: string;
  city: string;
  governorate: Governorate | "";
  postalCode: string;
  phone: string;
  registrationNo: string;
  taxId: string;
  latitude: number;
  longitude: number;
}

const steps = [
  {
    title: "Business Information",
    description: "Tell us about your business",
    fields: ["businessName", "businessType", "description"],
  },
  {
    title: "Contact Details",
    description: "Where can we reach you?",
    fields: ["address", "city", "governorate", "postalCode", "phone"],
  },
  {
    title: "Legal Information",
    description: "Your business registration details",
    fields: ["registrationNo", "taxId"],
  },
] as const;

export function SellerOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    businessName: "",
    businessType: "",
    description: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",
    phone: "",
    registrationNo: "",
    taxId: "",
    latitude: 36.8065, // Tunisia's center latitude
    longitude: 10.1815, // Tunisia's center longitude
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const progress = ((currentStep + 1) / steps.length) * 100;
  const setVerifiedSeller = useAuthStore((state) => state.setVerifiedSeller);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (field: keyof OnboardingFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const validateStep = () => {
    const currentFields = steps[currentStep].fields;
    const emptyFields = currentFields.filter(
      (field) => !formData[field as keyof OnboardingFormData]
    );

    if (emptyFields.length > 0) {
      setError(`Please fill in all fields`);
      return false;
    }

    setError("");
    return true;
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      await api.post("/sellers/complete-profile", formData);
      setVerifiedSeller(true);
      navigate("/seller/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              name="businessName"
              placeholder="Business Name"
              className="h-12 bg-muted/50"
              value={formData.businessName}
              onChange={handleChange}
              required
            />

            <Select
              value={formData.businessType}
              onValueChange={handleSelectChange("businessType")}
            >
              <SelectTrigger className="h-12 bg-muted/50">
                <SelectValue placeholder="Select Business Type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type: BusinessType) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              name="description"
              placeholder="Business Description"
              className="min-h-[100px] bg-muted/50"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <Input
              name="address"
              placeholder="Street Address"
              className="h-12 bg-muted/50"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <Input
              name="city"
              placeholder="City"
              className="h-12 bg-muted/50"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <Select
              value={formData.governorate}
              onValueChange={handleSelectChange("governorate")}
            >
              <SelectTrigger className="h-12 bg-muted/50">
                <SelectValue placeholder="Select Governorate" />
              </SelectTrigger>
              <SelectContent>
                {TUNISIA_GOVERNORATES.map((governorate) => (
                  <SelectItem key={governorate} value={governorate}>
                    {governorate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="postalCode"
              placeholder="Postal Code"
              className="h-12 bg-muted/50"
              value={formData.postalCode}
              onChange={handleChange}
              required
            />
            <Input
              name="phone"
              placeholder="Phone Number"
              className="h-12 bg-muted/50"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            
            <MapPicker
              initialPosition={[formData.latitude, formData.longitude]}
              onLocationSelect={(lat, lng) => {
                setFormData(prev => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng
                }));
              }}
            />
            <p className="text-sm text-muted-foreground text-center">
              Click on the map to set your business location
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Input
              name="registrationNo"
              placeholder="Business Registration Number"
              className="h-12 bg-muted/50"
              value={formData.registrationNo}
              onChange={handleChange}
              required
            />
            <Input
              name="taxId"
              placeholder="Tax ID"
              className="h-12 bg-muted/50"
              value={formData.taxId}
              onChange={handleChange}
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="container max-w-3xl py-16">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
            <p className="text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <Card className="p-6">
            {renderFormFields()}
            {error && (
              <p className="mt-4 text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || isLoading}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (validateStep()) {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    handleComplete();
                  }
                }
              }}
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : currentStep === steps.length - 1
                ? "Complete"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
