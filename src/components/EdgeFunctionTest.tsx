
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Server } from 'lucide-react';

const EdgeFunctionTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEdgeFunction = async () => {
    setTesting(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Testing Edge Functions...');
      
      const response = await fetch('http://37.27.20.208:8000/functions/v1/test-edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwODgxNjAwLCJleHAiOjE5MDg2NDgwMDB9.ESqAMd8u1zWZ1gJgsh8SNcm3SFdmq4Taf14qsgEX7Og'
        },
        body: JSON.stringify({ test: true })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
      
    } catch (err: any) {
      console.error('Error testing Edge Function:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Verificación Edge Functions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Verificando si tu instancia Supabase self-hosted soporta Edge Functions...</p>
          <p className="mt-1">URL: <code>http://37.27.20.208:8000</code></p>
        </div>

        <Button 
          onClick={testEdgeFunction} 
          disabled={testing}
          className="w-full"
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {testing ? 'Verificando...' : 'Probar Edge Functions'}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">¡Edge Functions funcionando!</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Resultado del Test:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <Badge variant="default">Funcionando</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Entorno:</span>
                  <span>{result.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Versión Deno:</span>
                  <span>{result.deno_version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variables de entorno:</span>
                  <Badge variant={result.capabilities?.env_variables ? "default" : "secondary"}>
                    {result.capabilities?.env_variables ? "Disponibles" : "No detectadas"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
              Timestamp: {result.timestamp}
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Error en la verificación</span>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Detalles del error:</h4>
              <p className="text-sm text-red-700">{error}</p>
              
              <div className="mt-3 text-xs text-red-600">
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Edge Functions no están habilitadas en tu instancia</li>
                  <li>Deno no está instalado/configurado</li>
                  <li>La función test-edge no está desplegada</li>
                  <li>Problemas de conectividad o CORS</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>Nota:</strong> Este test verifica si puedes ejecutar Edge Functions en tu Supabase self-hosted.</p>
          <p>Si funciona, podrás implementar la IA con memoria por usuario sin problemas.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EdgeFunctionTest;
