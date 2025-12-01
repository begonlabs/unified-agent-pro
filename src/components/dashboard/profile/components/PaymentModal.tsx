import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planName: string;
    planPrice: string;
    planType: 'basico' | 'avanzado' | 'pro';
    planFeatures: string[];
    planIcon: React.ComponentType<{ className?: string }>;
    planColor: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    open,
    onOpenChange,
    planName,
    planPrice,
    planType,
    planFeatures,
    planIcon: Icon,
    planColor,
}) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Debes iniciar sesión para realizar un pago');
                return;
            }

            // Call create-payment edge function
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: {
                    plan_type: planType,
                    user_id: user.id,
                },
            });

            if (error) {
                console.error('Error creating payment:', error);
                toast.error('Error al crear el pago. Por favor, intenta de nuevo.');
                return;
            }

            if (data?.payment_url) {
                // Redirect to dLocalGo payment page
                window.location.href = data.payment_url;
            } else {
                toast.error('No se pudo obtener la URL de pago');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Confirmar Pago
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de adquirir el plan {planName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Plan Summary */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${planColor.split(' ')[0]} border`}>
                                    <Icon className={`h-5 w-5 ${planColor.split(' ')[1]}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Plan {planName}</h3>
                                    <p className="text-sm text-gray-500">Pago único</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{planPrice}</div>
                                <div className="text-xs text-gray-500">USD</div>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Incluye:</p>
                            <ul className="space-y-2">
                                {planFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Nota:</strong> Serás redirigido a la pasarela de pago segura de dLocal Go para completar tu compra.
                        </p>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Total a pagar:</span>
                        <span className="text-2xl font-bold">{planPrice} USD</span>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="min-w-[120px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pagar Ahora
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
