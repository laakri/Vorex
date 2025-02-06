import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export function SignIn() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <form className="space-y-4">
        <Input
          type="email"
          placeholder="Email Address"
          className="h-12 bg-muted/50"
          required
        />

        <div className="space-y-1">
          <Input
            type="password"
            placeholder="Password"
            className="h-12 bg-muted/50"
            required
          />
          <div className="text-right">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link to="/auth/sign-up" className="text-primary hover:underline">
          Create one
        </Link>
      </div>
    </div>
  );
}
