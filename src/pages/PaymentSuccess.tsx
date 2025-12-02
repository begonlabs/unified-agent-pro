import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    const paymentId = searchParams.get('payment_id');

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirect to profile page
                    navigate('/dashboard?tab=profile');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-700">
                        ¡Pago Exitoso!
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        Tu pago ha sido procesado correctamente
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 text-center">
                            Tu plan será activado en los próximos minutos.
                            <br />
                            Recibirás un email de confirmación.
                        </p>
                    </div>

                    {paymentId && (
                        <div className="text-xs text-gray-500 text-center">
                            ID de pago: {paymentId}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                            Redirigiendo al dashboard en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard?tab=profile')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Ir al Dashboard Ahora
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};
