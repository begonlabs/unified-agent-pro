```
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CreditCard,
    CheckCircle,
    Globe,
    Clock,
    AlertTriangle,
    Bot
} from 'lucide-react';
import { Profile, Plan } from '../types';
import { ProfileService } from '../services/profileService';
import { PaymentModal } from './PaymentModal';
import { Progress } from '@/components/ui/progress';
import { getMessageUsagePercentage, PLAN_LIMITS } from '@/lib/channelPermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentHistoryItem {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    plan_type: string;
    payment_method: string;
}

interface SubscriptionContentProps {
    profile: Profile;
}

export const SubscriptionContent: React.FC<SubscriptionContentProps> = ({ profile }) => {
    const plans = ProfileService.getPlans(profile.plan_type);
    const currentPlan = plans.find(p => p.current);
    const PlanIcon = ProfileService.getPlanIcon(profile.plan_type);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    React.useEffect(() => {
        const fetchPayments = async () => {
            try {
                const userId = (profile as any).user_id || profile.id;
                if (!userId) return;

                // Using any for table name because types might not be updated yet after manual migration
                const { data, error } = await (supabase
                    .from('payments' as any)
                    .select('*')
                    .eq('user_id', (profile as any).user_id || profile.id) // Fallback to id if user_id missing
                    .order('created_at', { ascending: false })) as any;

                if (error) throw error;
                // Cast data to PaymentHistoryItem[] to satisfy the state type
                setPayments((data as any[])?.map(item => ({
                    id: item.id,
                    created_at: item.created_at,
                    amount: item.amount,
                    currency: item.currency,
                    status: item.status,
                    plan_type: item.plan_type,
                    payment_method: item.payment_method
                })) || []);
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoadingPayments(false);
            }
        };

        fetchPayments();
    }, [(profile as any).user_id, profile.id]);

    const handleCancelSubscription = async () => {
        try {
            setCancelling(true);
            const { error } = await supabase.functions.invoke('cancel-subscription', {
                body: { user_id: (profile as any).user_id || profile.id }
            });

            if (error) throw error;

            toast.success('Suscripción cancelada exitosamente');
            setCancelDialogOpen(false);
            // In a real app we might want to refresh profile data here
            window.location.reload();
        } catch (error) {
            console.error('Error canceling subscription:', error);
            toast.error('Error al cancelar la suscripción');
        } finally {
            setCancelling(false);
        }
    };

    // Calculate trial days remaining
    const trialInfo = useMemo(() => {
        if (!profile.is_trial || !profile.trial_end_date) return null;

        const now = new Date();
        const trialEnd = new Date(profile.trial_end_date);
        const diffTime = trialEnd.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            daysRemaining: Math.max(0, daysRemaining),
            isExpiringSoon: daysRemaining <= 2 && daysRemaining > 0,
            hasExpired: daysRemaining <= 0
        };
    }, [profile.is_trial, profile.trial_end_date]);

    const handleUpgrade = (plan: Plan) => {
        setSelectedPlan(plan);
        setPaymentModalOpen(true);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Plan Actual */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Tu Plan Actual
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        Información detallada sobre tu suscripción actual
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Trial Warning */}
                    {profile.is_trial && trialInfo && (
                        <Alert className={`mb - 4 ${
    trialInfo.hasExpired
    ? 'border-red-500 bg-red-50'
    : trialInfo.isExpiringSoon
        ? 'border-amber-500 bg-amber-50'
        : 'border-blue-500 bg-blue-50'
} `}>
                            <AlertTriangle className={`h - 4 w - 4 ${
    trialInfo.hasExpired
    ? 'text-red-600'
    : trialInfo.isExpiringSoon
        ? 'text-amber-600'
        : 'text-blue-600'
} `} />
                            <AlertDescription className={`${
    trialInfo.hasExpired
    ? 'text-red-800'
    : trialInfo.isExpiringSoon
        ? 'text-amber-800'
        : 'text-blue-800'
} `}>
                                {trialInfo.hasExpired ? (
                                    <span>
                                        <strong>Tu período de prueba ha expirado.</strong> Actualiza a un plan de pago para seguir usando todas las funcionalidades.
                                    </span>
                                ) : (
                                    <span>
                                        <strong>Período de prueba:</strong> Te quedan {trialInfo.daysRemaining} día{trialInfo.daysRemaining !== 1 ? 's' : ''} de prueba gratuita.
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="relative overflow-hidden">
                        <div className={`p - 6 rounded - xl border - 2 ${ currentPlan?.bgColor } ${ ProfileService.getPlanColor(profile.plan_type) } border - opacity - 50`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p - 3 rounded - lg ${ currentPlan?.bgColor } border`}>
                                        <PlanIcon className={`h - 6 w - 6 ${ currentPlan?.color } `} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold">
                                                Plan {currentPlan?.name}
                                            </h3>
                                            {profile.is_trial && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Prueba
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-gray-600">
                                            {currentPlan?.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">
                                        {currentPlan?.price}
                                    </div>
                                    <div className="text-sm text-gray-500">{profile.is_trial ? '' : '/mes'}</div>
                                </div>
                            </div>



                            <div className="mt-6 mb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-purple-600" />
                                        Consumo de Mensajes IA
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {profile.messages_sent_this_month || 0} / {profile.messages_limit ?? PLAN_LIMITS[profile.plan_type]?.messages ?? 0}
                                    </span>
                                </div>
                                <div className="relative">
                                    <Progress
                                        value={getMessageUsagePercentage(profile)}
                                        className="h-3 bg-gray-100 border border-gray-200"
                                        indicatorClassName={`${
    getMessageUsagePercentage(profile) >= 90
    ? 'bg-gradient-to-r from-amber-500 to-red-500'
    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
} transition - all duration - 1000 ease - out`}
                                    />
                                    {/* Shimmer overlay */}
                                    <div
                                        className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-full pointer-events-none"
                                        style={{ width: `${ getMessageUsagePercentage(profile) }% ` }}
                                    >
                                        <div className="h-full w-full animate-shimmer"></div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Estado:</span>
                                    <p className="font-medium">
                                        {profile.is_trial ? 'Período de Prueba' : profile.is_active ? 'Activo' : 'Inactivo'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Inicio:</span>
                                    <p className="font-medium">{ProfileService.formatDate(profile.subscription_start)}</p>
                                </div>
                                {profile.is_trial && profile.trial_end_date ? (
                                    <div>
                                        <span className="text-gray-500">Fin de prueba:</span>
                                        <p className="font-medium">{ProfileService.formatDate(profile.trial_end_date)}</p>
                                    </div>
                                ) : profile.subscription_end && (
                                    <>
                                        <div>
                                            <span className="text-gray-500">Próxima renovación:</span>
                                            <p className="font-medium">{ProfileService.formatDate(profile.subscription_end)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Auto-renovación:</span>
                                            <div className="flex flex-col items-start gap-1">
                                                <p className="font-medium text-green-600">Activada</p>
                                                {profile.payment_status === 'active' && !profile.is_trial && (
                                                    <Button
                                                        variant="link"
                                                        className="text-red-500 h-auto p-0 text-xs hover:text-red-600"
                                                        onClick={() => setCancelDialogOpen(true)}
                                                    >
                                                        Cancelar suscripción
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cambiar Plan */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Cambiar Plan</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        Elige el plan que mejor se adapte a las necesidades de tu empresa
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {plans.map((plan) => {
                            const Icon = plan.icon;
                            return (
                                <Card
                                    key={plan.name}
                                    className={`relative transition - all duration - 200 h - full flex flex - col ${
    plan.current
    ? 'ring-2 ring-blue-500 shadow-lg'
    : 'hover:shadow-md hover:scale-105'
} `}
                                >
                                    {plan.current && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge className="bg-blue-500 text-white border-blue-600">
                                                Plan Actual
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center p-4 sm:p-6">
                                        <div className={`mx - auto p - 2 sm: p - 3 rounded - full ${ plan.bgColor } border mb - 2`}>
                                            <Icon className={`h - 5 w - 5 sm: h - 6 sm: w - 6 ${ plan.color } `} />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                                        <div className="text-2xl sm:text-3xl font-bold">
                                            {plan.price}
                                            <span className="text-xs sm:text-sm font-normal text-gray-500">/mes</span>
                                        </div>
                                        <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4 flex-1 flex flex-col">
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="pt-4 mt-auto">
                                            {plan.current ? (
                                                <Button variant="outline" className="w-full" disabled>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Plan Actual
                                                </Button>
                                            ) : plan.isTrial ? (
                                                <Button variant="outline" className="w-full" disabled>
                                                    Plan de Prueba
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full"
                                                    variant={'outline'}
                                                    onClick={() => handleUpgrade(plan)}
                                                >
                                                    Cambiar a {plan.name}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Historial de Facturación */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Historial de Facturación
                    </CardTitle>
                    <CardDescription>
                        Revisa tus pagos y facturas anteriores
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingPayments ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-500">Cargando historial...</p>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 font-medium text-gray-500">Fecha</th>
                                        <th className="text-left py-3 font-medium text-gray-500">Descripción</th>
                                        <th className="text-left py-3 font-medium text-gray-500">Monto</th>
                                        <th className="text-left py-3 font-medium text-gray-500">Estado</th>
                                        <th className="text-right py-3 font-medium text-gray-500">Recibo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3">
                                                {payment.plan_type === 'basico' ? 'Plan Básico' :
                                                    payment.plan_type === 'avanzado' ? 'Plan Avanzado' : 'Plan Pro'}
                                                <span className="text-xs text-gray-400 ml-1">
                                                    ({payment.payment_method || 'Tarjeta'})
                                                </span>
                                            </td>
                                            <td className="py-3 font-medium">
                                                {payment.amount} {payment.currency}
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                    }
                                                >
                                                    {payment.status === 'approved' ? 'Pagado' :
                                                        payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Button variant="ghost" size="sm" className="h-8">
                                                    Ver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <CreditCard className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial de pagos</h3>
                            <p className="text-gray-500 mb-4">
                                Las facturas y recibos aparecerán aquí una vez que realices tu primer pago.
                            </p>
                            {/* "Ver métodos de pago" button removed as requested */}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Modal */}
            {
                selectedPlan && (() => {
                    // Normalize plan name to match expected types
                    const normalizePlanType = (name: string): 'basico' | 'avanzado' | 'pro' => {
                        const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        if (normalized === 'basico') return 'basico';
                        if (normalized === 'avanzado') return 'avanzado';
                        if (normalized === 'pro') return 'pro';
                        return 'basico'; // fallback
                    };

                    return (
                        <PaymentModal
                            open={paymentModalOpen}
                            onOpenChange={setPaymentModalOpen}
                            planName={selectedPlan.name}
                            planPrice={selectedPlan.price}
                            planType={normalizePlanType(selectedPlan.name)}
                            planFeatures={selectedPlan.features}
                            planIcon={selectedPlan.icon}
                            planColor={selectedPlan.bgColor}
                        />
                    );
                })()
            }

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar tu suscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Al cancelar, perderás acceso a las funciones premium al finalizar el período actual.
                            Tu suscripción permanecerá activa hasta la fecha de renovación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Mantener suscripción</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleCancelSubscription();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelando...' : 'Sí, cancelar suscripción'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};
```
