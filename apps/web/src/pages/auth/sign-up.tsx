import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export function SignUp() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          Enter your details to get started as a seller
        </p>
      </div>

      <form className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            placeholder="First Name"
            className="h-12 bg-muted/50"
            required
          />
          <Input
            placeholder="Last Name"
            className="h-12 bg-muted/50"
            required
          />
        </div>

        <Input
          type="email"
          placeholder="Email Address"
          className="h-12 bg-muted/50"
          required
        />

        <Input
          type="password"
          placeholder="Create Password"
          className="h-12 bg-muted/50"
          required
        />

        <Input
          type="password"
          placeholder="Confirm Password"
          className="h-12 bg-muted/50"
          required
        />

        <Button
          type="submit"
          className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        >
          Create Account
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
