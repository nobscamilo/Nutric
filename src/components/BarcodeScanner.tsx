'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
}

interface BarcodeScannerProps {
  onScanResult: (result: ScanResult) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Quagga: any;
  }
}

export default function BarcodeScanner({ onScanResult, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Inactivo');
  const [isQuaggaLoaded, setIsQuaggaLoaded] = useState(false);

  // Load Quagga script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js';
    script.async = true;
    script.onload = () => {
      setIsQuaggaLoaded(true);
      console.log('✓ Quagga loaded successfully');
    };
    script.onerror = () => {
      setError('Error al cargar la librería del scanner');
      setIsSupported(false);
      onError?.('Error al cargar la librería del scanner');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  // Check camera support
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsSupported(false);
          setError('Cámara no soportada en este dispositivo');
          onError?.('Cámara no soportada en este dispositivo');
          return;
        }

        // Test camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        stream.getTracks().forEach(track => track.stop());
        setIsSupported(true);
      } catch (err) {
        console.warn('Camera access test failed:', err);
        setIsSupported(false);
        setError('No se puede acceder a la cámara');
        onError?.('No se puede acceder a la cámara');
      }
    };

    checkCameraSupport();
  }, [onError]);

  const startScanning = async () => {
    if (!isQuaggaLoaded) {
      setError('Scanner no está listo. Intenta de nuevo.');
      return;
    }

    if (!isSupported) {
      setError('Scanner no soportado en este dispositivo');
      return;
    }

    try {
      setError(null);
      setStatus('Iniciando cámara...');
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.style.display = 'block';
      }

      window.Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: 400,
            height: 300,
            facingMode: 'environment'
          }
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader'
          ]
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        }
      }, (err: any) => {
        if (err) {
          console.error('Quagga init error:', err);
          setError('Error al inicializar el scanner');
          setStatus('Error');
          setIsScanning(false);
          onError?.(err.message || 'Error al inicializar el scanner');
          return;
        }

        try {
          window.Quagga.start();
          setStatus('Escaneando... (apunta al código de barras)');
          console.log('✓ Scanner iniciado correctamente');
        } catch (startErr) {
          console.error('Quagga start error:', startErr);
          setError('Error al iniciar el scanner');
          setStatus('Error');
          setIsScanning(false);
        }
      });

      // Handle detection
      window.Quagga.onDetected((data: any) => {
        const code = data.codeResult.code;
        const format = data.codeResult.format;
        
        console.log('Código detectado:', code, format);
        setStatus(`Código detectado: ${code}`);
        
        const result: ScanResult = {
          code,
          format,
          timestamp: Date.now()
        };
        
        onScanResult(result);
        
        // Stop scanning after detection
        setTimeout(() => {
          stopScanning();
        }, 1000);
      });

      // Handle processing errors
      window.Quagga.onProcessed((result: any) => {
        const drawingCtx = window.Quagga.canvas.ctx.overlay;
        const drawingCanvas = window.Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), 
                                parseInt(drawingCanvas.getAttribute('height')));
            result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
              window.Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 });
            });
          }

          if (result.box) {
            window.Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00F', lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            window.Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
          }
        }
      });

    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError('Error al iniciar el scanner: ' + err.message);
      setStatus('Error');
      setIsScanning(false);
      onError?.(err.message || 'Error al iniciar el scanner');
    }
  };

  const stopScanning = () => {
    try {
      if (window.Quagga && isScanning) {
        window.Quagga.stop();
        console.log('✓ Scanner detenido');
      }
      
      setIsScanning(false);
      setStatus('Inactivo');
      
      if (videoRef.current) {
        videoRef.current.style.display = 'none';
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
      setError('Error al detener el scanner');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📷 Escáner de Códigos</CardTitle>
          <CardDescription>Scanner de códigos de barras para alimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Scanner no disponible: {error || 'Dispositivo no compatible'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📷 Escáner de Códigos</CardTitle>
        <CardDescription>Scanner de códigos de barras para alimentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="mb-3">
              <span className="font-semibold text-gray-600">Estado: </span>
              <span className={`font-medium ${
                status.includes('Error') ? 'text-red-600' : 
                status.includes('detectado') ? 'text-green-600' : 
                status.includes('Escaneando') ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {status}
              </span>
            </div>
            
            <video
              ref={videoRef}
              className="max-w-full h-auto rounded-lg mx-auto hidden"
              autoPlay
              muted
              playsInline
              style={{ maxWidth: '400px', maxHeight: '300px' }}
            />
            
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            <div className="mt-4">
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                variant={isScanning ? "destructive" : "default"}
                disabled={!isQuaggaLoaded}
                className="min-w-[120px]"
              >
                {!isQuaggaLoaded ? (
                  'Cargando...'
                ) : isScanning ? (
                  '⏹️ Detener'
                ) : (
                  '📷 Escanear'
                )}
              </Button>
            </div>
            
            {!isScanning && (
              <p className="text-sm text-gray-500 mt-2">
                Presiona el botón para iniciar el scanner
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}