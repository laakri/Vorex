import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleGoogleCallback = useAuthStore(state => state.handleGoogleCallback);
  const { user } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleGoogleCallback(token)
        .then(() => {
          if (user?.role && user.role.length > 1) {
            navigate('/role-selection');
          } else if (user?.role && user.role.length === 1) {
            navigate('/seller');
          } else {
            navigate('/auth/sign-in');
          }
        })
        .catch(() => navigate('/auth/sign-in'));
    } else {
      navigate('/auth/sign-in');
    }
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you</p>
      </div>
    </div>
  );
} 