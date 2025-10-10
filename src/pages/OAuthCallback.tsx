import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Procesar parámetros de OAuth
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/auth?error=oauth_error');
      return;
    }

    if (code) {
      // Aquí se procesaría el código de autorización
      console.log('OAuth code received:', code);
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Procesando autorización...</p>
    </div>
  );
};

export default OAuthCallback;
