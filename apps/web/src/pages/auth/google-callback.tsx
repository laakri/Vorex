import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

// Define a type for the user data
interface UserData {
  role?: string[];
  [key: string]: any; // Allow other properties
}

export function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleGoogleCallback = useAuthStore(state => state.handleGoogleCallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsLoading(true);
      handleGoogleCallback(token)
        .then(() => {
          const userData = useAuthStore.getState().user as UserData;
          if (userData?.role && userData.role.length > 1) {
            navigate('/role-selection');
          } else if (userData?.role && userData.role.length === 1) {
            navigate('/seller');
          } else {
            navigate('/auth/sign-in');
          }
        })
        .catch((err) => {
          console.error('Google callback error:', err);
          setError(true);
          navigate('/auth/sign-in');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      navigate('/auth/sign-in');
    }
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {error ? (
          <h2 className="text-xl font-semibold text-destructive">Authentication failed</h2>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Completing sign in...</h2>
            <p className="text-muted-foreground">Please wait while we redirect you</p>
            {isLoading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 