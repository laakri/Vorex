import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      // Show success message instead of navigating directly to onboarding
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Show success screen after registration
  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-muted/30 border-muted">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold">Almost there!</h2>
            <p className="text-muted-foreground">
              We've sent a verification email to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to activate your account.
              If you don't see the email, check your spam folder.
            </p>
            
            <div className="mt-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth/sign-in")}
                className="flex items-center"
              >
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={async () => {
                try {
                  // Make an API call to resend verification email
                  await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email }),
                  });
                  alert('Verification email resent. Please check your inbox.');
                } catch (error) {
                  console.error('Failed to resend verification email', error);
                  alert('Failed to resend verification email. Please try again later.');
                }
              }}
            >
              Resend verification email
            </Button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="fullName"
          placeholder="Full Name"
          className="h-12 bg-muted/50"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <Input
          name="email"
          type="email"
          placeholder="Email Address"
          className="h-12 bg-muted/50"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          name="password"
          type="password"
          placeholder="Create Password"
          className="h-12 bg-muted/50"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          className="h-12 bg-muted/50"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/auth/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
