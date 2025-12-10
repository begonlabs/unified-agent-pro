import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Globe, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScrapedData {
    description: string;
    services: string;
    products: string;
    pricing: string;
    contact: string;
    about: string;
}

interface WebsiteScraperModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: string) => void;
}

export const WebsiteScraperModal: React.FC<WebsiteScraperModalProps> = ({ open, onOpenChange, onSave }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [scrapedData, setScrapedData] = useState<ScrapedData>({
        description: '',
        services: '',
        products: '',
        pricing: '',
        contact: '',
        about: ''
    });
    const { toast } = useToast();

    const handleScrape = async () => {
        if (!url) {
            toast({
                title: "URL requerida",
                description: "Por favor ingresa una URL válida",
                variant: "destructive"
            });
            return;
        }

        // Basic URL validation
        let validUrl = url;
        if (!url.startsWith('http')) {
            validUrl = `https://${url}`;
        }

        setStep('processing');
        setLoading(true);
        setProgress(10);

        // Simulate progress while waiting
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 5;
            });
        }, 500);

        try {
            console.log('Invoking scrape-website function with URL:', validUrl);
            const { data, error } = await supabase.functions.invoke('scrape-website', {
                body: { url: validUrl }
            });

            if (error) throw error;

            console.log('Scrape result:', data);

            // Format array fields if they come as arrays
            const formatField = (field: any) => {
                if (Array.isArray(field)) {
                    // Check if it's the structured products array
                    if (field.length > 0 && typeof field[0] === 'object' && field[0] !== null && 'name' in field[0]) {
                        return field.map((p: any) => {
                            const price = p.price ? ` (${p.price})` : '';
                            const desc = p.description ? `: ${p.description}` : '';
                            return `- ${p.name}${price}${desc}`;
                        }).join('\n');
                    }
                    // Simple string array
                    return field.join('\n');
                }
                // Handle objects (like contact info)
                if (typeof field === 'object' && field !== null) {
                    return Object.entries(field)
                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                        .join('\n');
                }
                return field || '';
            };

            setScrapedData({
                description: data.description || '',
                services: formatField(data.services),
                products: formatField(data.products),
                pricing: data.pricing || '',
                contact: formatField(data.contact),
                about: data.about || ''
            });

            setProgress(100);
            setTimeout(() => {
                setStep('review');
                setLoading(false);
            }, 500);

        } catch (error: any) {
            console.error('Scraping error:', error);
            toast({
                title: "Error al analizar el sitio",
                description: error.message || "No se pudo extraer información del sitio web",
                variant: "destructive"
            });
            setStep('input');
            setLoading(false);
        } finally {
            clearInterval(interval);
        }
    };

    const handleSave = () => {
        // Format the data into a readable text block
        const formattedText = `
--- INFORMACIÓN IMPORTADA DE ${url} ---

[DESCRIPCIÓN]
${scrapedData.description}

[SOBRE NOSOTROS]
${scrapedData.about}

[SERVICIOS]
${scrapedData.services}

[PRODUCTOS]
${scrapedData.products}

[PRECIOS]
${scrapedData.pricing}

[CONTACTO]
${scrapedData.contact}
    `.trim();

        onSave(formattedText);
        onOpenChange(false);

        // Reset state
        setTimeout(() => {
            setStep('input');
            setUrl('');
            setProgress(0);
        }, 500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        Conectar Website
                    </DialogTitle>
                    <DialogDescription>
                        Importa información automáticamente desde tu sitio web usando IA
                    </DialogDescription>
                </DialogHeader>

                {step === 'input' && (
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL del Sitio Web</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    placeholder="ejemplo.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                                />
                                <Button onClick={handleScrape} disabled={!url}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Analizar
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                La IA visitará tu sitio, leerá el contenido y extraerá información relevante sobre tu negocio.
                            </p>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-12 space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="relative">
                                <Globe className="h-16 w-16 text-purple-200 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 max-w-md mx-auto">
                            <h3 className="font-medium text-lg">Analizando tu sitio web...</h3>
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                                Extrayendo servicios, productos y datos de contacto
                            </p>
                        </div>
                    </div>
                )}

                {step === 'review' && (
                    <div className="py-4 space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-900">¡Análisis Completado!</h4>
                                <p className="text-sm text-green-700">
                                    Hemos encontrado la siguiente información. Revísala y edítala si es necesario antes de guardar.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Descripción del Negocio</Label>
                                <Textarea
                                    value={scrapedData.description}
                                    onChange={(e) => setScrapedData({ ...scrapedData, description: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sobre Nosotros / Misión</Label>
                                <Textarea
                                    value={scrapedData.about}
                                    onChange={(e) => setScrapedData({ ...scrapedData, about: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Servicios</Label>
                                <Textarea
                                    value={scrapedData.services}
                                    onChange={(e) => setScrapedData({ ...scrapedData, services: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Productos</Label>
                                <Textarea
                                    value={scrapedData.products}
                                    onChange={(e) => setScrapedData({ ...scrapedData, products: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Precios</Label>
                                <Textarea
                                    value={scrapedData.pricing}
                                    onChange={(e) => setScrapedData({ ...scrapedData, pricing: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contacto</Label>
                                <Textarea
                                    value={scrapedData.contact}
                                    onChange={(e) => setScrapedData({ ...scrapedData, contact: e.target.value })}
                                    className="h-24"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'review' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('input')}>
                                Volver
                            </Button>
                            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Guardar en Base de Conocimiento
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
