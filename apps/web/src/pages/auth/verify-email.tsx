import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/axios";

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        
        // Auto redirect after success
        setTimeout(() => {
          navigate("/auth/sign-in");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. The link may be invalid or expired.");
      }
    };

    verifyEmail();
  }, [token, api, navigate, toast]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40">
      <Card className="w-[400px] max-w-[90%]">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been verified!"}
            {status === "error" && "Email verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          {status === "loading" && (
            <Loader2 className="h-16 w-16 text-primary animate-spin my-4" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-16 w-16 text-primary my-4" />
          )}
          {status === "error" && (
            <AlertCircle className="h-16 w-16 text-destructive my-4" />
          )}
          
          <p className="mt-2 mb-4">{message}</p>
          
          {status === "success" && (
            <p>Redirecting you to the login page...</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== "loading" && (
            <Button asChild>
              <Link to="/auth/sign-in">Go to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}; 