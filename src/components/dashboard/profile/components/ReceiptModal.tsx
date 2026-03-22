import React, { useRef } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, X } from 'lucide-react';
import { Profile } from '../types';

interface PaymentHistoryItem {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    plan_type: string;
    payment_method: string;
}

interface ReceiptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: PaymentHistoryItem | null;
    profile: Profile;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, onOpenChange, payment, profile }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!payment) return null;

    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(new Date(payment.created_at));

    const planName = payment.plan_type === 'basico' ? 'Plan Básico' :
        payment.plan_type === 'avanzado' ? 'Plan Avanzado' : 'Plan Pro';

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    const handlePrint = () => {
        if (receiptRef.current) {
            const printContent = receiptRef.current.innerHTML;
            const originalContent = document.body.innerHTML;
            
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); // Reload to restore React bindings after native print
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 h-[90vh] overflow-y-auto bg-white [&>button]:hidden" aria-describedby={undefined}>
                <DialogTitle className="sr-only">Recibo de pago</DialogTitle>
                {/* Modal Header Actions */}
                <div className="sticky top-0 right-0 p-4 flex justify-end gap-2 bg-white/80 backdrop-blur-sm z-10 border-b">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="flex gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                        Descargar PDF / Imprimir
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-gray-900 hover:bg-gray-100 hover:text-gray-900">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Receipt Content */}
                <div ref={receiptRef} className="p-8 sm:p-12 font-sans bg-white text-gray-900">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-xl font-medium text-gray-800">Recibo para {profile.company_name || `${profile.first_name} ${profile.last_name}`}</h1>
                            <p className="text-sm text-gray-500 mt-1">Identificador de cuenta: {profile.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Logo representation similar to screenshot */}
                            <svg width="24" height="24" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                <path d="M40 0C17.909 0 0 17.909 0 40C0 62.091 17.909 80 40 80C62.091 80 80 62.091 80 40C80 17.909 62.091 0 40 0Z" fill="currentColor"/>
                                <path d="M20 20L60 20L60 60L20 60L20 20Z" fill="#3a0caa"/>
                                <path d="M30 30L50 30L50 50L30 50L30 30Z" fill="#710db2"/>
                            </svg>
                            <span className="text-2xl font-bold tracking-tight text-gray-900">OndAI</span>
                        </div>
                    </div>

                    <Separator className="my-6 bg-gray-200" />

                    {/* Meta/Details Section */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                        {/* Left column details */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Fecha de la factura/pago</p>
                                <p className="font-semibold text-sm">{formattedDate}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Método de pago</p>
                                <p className="font-semibold text-sm">{payment.payment_method ? payment.payment_method.toUpperCase() : 'Tarjeta'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Número de referencia</p>
                                <p className="font-semibold text-sm">{payment.id.split('-')[0].toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Identificador de la transacción</p>
                                <p className="font-semibold text-sm">{payment.id.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tipo de producto</p>
                                <p className="font-semibold text-sm">Suscripción OndAI</p>
                            </div>
                        </div>

                        {/* Right column amounts */}
                        <div className="text-right flex flex-col items-end pt-4">
                            <p className={`text-lg mb-2 ${payment.status === 'approved' ? 'text-gray-900' : payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {payment.status === 'approved' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                            </p>
                            <p className="text-4xl font-light tracking-tight text-gray-900 mb-2">
                                {formatCurrency(payment.amount, payment.currency)}
                            </p>
                            <p className="text-xs text-gray-500 max-w-[250px]">
                                {payment.status === 'approved' 
                                    ? 'El pago se ha procesado correctamente para su cuenta de OndAI.'
                                    : 'Existen problemas con el procesamiento del pago, por favor revise.'}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-8 bg-gray-200" />

                    {/* Table section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Planes</h2>
                        <Separator className="bg-gray-200" />
                        
                        <div className="py-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Suscripción_{planName.replace(' ', '')}</p>
                                    <p className="text-xs text-gray-500">{formattedDate}</p>
                                </div>
                                <p className="font-bold text-sm text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between text-xs text-gray-600">
                                <p className="ml-8 tracking-wide">Renovación de suscripción OndAI {planName}</p>
                                <p>1 Mes</p>
                                <p>{formatCurrency(payment.amount, payment.currency)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Company Info */}
                    <div className="mt-24 pt-8 text-xs text-gray-400">
                        <p>OndAI Solutions</p>
                        <p>Plataforma de automatización inteligente</p>
                        <p>Montevideo, Uruguay</p>
                        <p className="mt-2 text-gray-300">Este documento es un comprobante de pago electrónico.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
