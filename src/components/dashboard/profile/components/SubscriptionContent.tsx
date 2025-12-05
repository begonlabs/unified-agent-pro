import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface SubscriptionContentProps {
    profile: Profile;
}

export const SubscriptionContent: React.FC<SubscriptionContentProps> = ({ profile }) => {
    const plans = ProfileService.getPlans(profile.plan_type);
    const currentPlan = plans.find(p => p.current);
    const PlanIcon = ProfileService.getPlanIcon(profile.plan_type);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
                        <Alert className={`mb-4 ${trialInfo.hasExpired
                            ? 'border-red-500 bg-red-50'
                            : trialInfo.isExpiringSoon
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-blue-500 bg-blue-50'
                            }`}>
                            <AlertTriangle className={`h-4 w-4 ${trialInfo.hasExpired
                                ? 'text-red-600'
                                : trialInfo.isExpiringSoon
                                    ? 'text-amber-600'
                                    : 'text-blue-600'
                                }`} />
                            <AlertDescription className={`${trialInfo.hasExpired
                                ? 'text-red-800'
                                : trialInfo.isExpiringSoon
                                    ? 'text-amber-800'
                                    : 'text-blue-800'
                                }`}>
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
                        <div className={`p-6 rounded-xl border-2 ${currentPlan?.bgColor} ${ProfileService.getPlanColor(profile.plan_type)} border-opacity-50`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg ${currentPlan?.bgColor} border`}>
                                        <PlanIcon className={`h-6 w-6 ${currentPlan?.color}`} />
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
                                        indicatorClassName={`${getMessageUsagePercentage(profile) >= 90
                                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                                            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                                            } transition-all duration-1000 ease-out`}
                                    />
                                    {/* Shimmer overlay */}
                                    <div
                                        className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-full pointer-events-none"
                                        style={{ width: `${getMessageUsagePercentage(profile)}%` }}
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
                                            <p className="font-medium text-green-600">Activada</p>
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
                                    className={`relative transition-all duration-200 h-full flex flex-col ${plan.current
                                        ? 'ring-2 ring-blue-500 shadow-lg'
                                        : 'hover:shadow-md hover:scale-105'
                                        }`}
                                >
                                    {plan.current && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge className="bg-blue-500 text-white border-blue-600">
                                                Plan Actual
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center p-4 sm:p-6">
                                        <div className={`mx-auto p-2 sm:p-3 rounded-full ${plan.bgColor} border mb-2`}>
                                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${plan.color}`} />
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
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial de pagos</h3>
                        <p className="text-gray-500 mb-4">
                            Las facturas y recibos aparecerán aquí una vez que realices tu primer pago.
                        </p>
                        <Button variant="outline" size="sm">
                            <Globe className="h-4 w-4 mr-2" />
                            Ver métodos de pago
                        </Button>
                    </div>
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
        </div >
    );
};
