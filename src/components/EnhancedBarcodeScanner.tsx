'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScanResult } from '@/types/nutrition';
import { OpenFoodFactsService, FoodItemWithImage } from '@/lib/openFoodFactsService';

interface EnhancedBarcodeScannerProps {
  onScanResult: (result: ScanResult) => void;
  onFoodFound: (food: FoodItemWithImage) => void;
  isScanning: boolean;
  onToggleScanning: () => void;
}

export default function EnhancedBarcodeScanner({ 
  onScanResult, 
  onFoodFound,
  isScanning, 
  onToggleScanning 
}: EnhancedBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Inactivo');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [isSearchingProduct, setIsSearchingProduct] = useState<boolean>(false);
  const [lastFoundProduct, setLastFoundProduct] = useState<FoodItemWithImage | null>(null);

  // Verificar soporte del navegador al montar
  useEffect(() => {
    const checkSupport = () => {
      const hasUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasQuagga = typeof window !== 'undefined' && !!(window as any).Quagga;
      
      if (!hasUserMedia) {
        setError('Tu navegador no soporta acceso a la cámara');
        setIsSupported(false);
        return;
      }

      if (!hasQuagga) {
        setError('Libería de scanner no cargada. Asegúrate de que Quagga.js esté cargado.');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      setError(null);
    };

    checkSupport();
  }, []);

  // Manejar cambios en el estado de scanning
  useEffect(() => {
    if (isScanning && isSupported) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isScanning, isSupported]);

  const startScanning = async () => {
    if (!videoRef.current || !isSupported) return;

    try {
      setStatus('Iniciando cámara...');
      setError(null);
      setLastFoundProduct(null);

      const Quagga = (window as any).Quagga;
      if (!Quagga) {
        throw new Error('Scanner library not loaded');
      }

      // Configuración del scanner optimizada
      const config = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment', // Cámara trasera preferida
            aspectRatio: { ideal: 4/3 }
          },
          area: { // Área de escaneo centrada
            top: '20%',
            right: '15%',
            left: '15%',
            bottom: '20%'
          }
        },
        decoder: {
          readers: [
            'ean_reader',      // EAN-13
            'ean_8_reader',    // EAN-8
            'code_128_reader', // Code 128
            'code_39_reader',  // Code 39
            'upc_reader',      // UPC-A
            'codabar_reader'   // Codabar
          ],
          debug: {
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showPatchLabels: false,
            showRemainingPatchLabels: false,
            boxFromPatches: {
              showTransformed: false,
              showTransformedBox: false,
              showBB: false
            }
          }
        },
        numOfWorkers: 2,
        frequency: 10, // Escaneos por segundo
        locate: true,
        halfSample: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        }
      };

      // Inicializar Quagga
      Quagga.init(config, (err: any) => {
        if (err) {
          console.error('Error inicializando scanner:', err);
          setError(`Error al inicializar la cámara: ${err.message || 'Error desconocido'}`);
          setStatus('Error');
          return;
        }

        Quagga.start();
        setStatus('🔍 Escaneando... Apunta al código de barras');
        console.log('✅ Scanner con OpenFoodFacts iniciado correctamente');
      });

      // Manejar detección de códigos
      Quagga.onDetected(async (data: any) => {
        const now = Date.now();
        
        // Evitar múltiples detecciones del mismo código (debounce de 3 segundos)
        if (now - lastScanTime < 3000) return;
        
        setLastScanTime(now);

        const code = data.codeResult.code;
        const format = data.codeResult.format;

        console.log(`📷 Código detectado: ${code} (${format})`);
        setStatus(`✅ Código detectado: ${code}`);
        setIsSearchingProduct(true);

        // Emitir resultado del scan inmediatamente
        const result: ScanResult = {
          code,
          format,
          timestamp: now
        };
        onScanResult(result);

        try {
          // Buscar automáticamente en OpenFoodFacts
          setStatus(`🔍 Buscando producto en OpenFoodFacts...`);
          const product = await OpenFoodFactsService.getProductByBarcode(code);
          
          if (product) {
            setLastFoundProduct(product);
            setStatus(`🎉 Producto encontrado: ${product.name}`);
            console.log(`✅ Producto encontrado en OpenFoodFacts:`, product);
            
            // Auto-agregar el producto encontrado
            onFoodFound(product);
            
            // Mostrar éxito por 3 segundos
            setTimeout(() => {
              if (!isScanning) return;
              setStatus('🔍 Escaneando... Apunta al código de barras');
              setLastFoundProduct(null);
            }, 3000);
            
          } else {
            setStatus(`❌ Producto no encontrado (${code})`);
            console.log(`❌ No se encontró producto para código: ${code}`);
            
            // Volver al estado de escaneo después de 2 segundos
            setTimeout(() => {
              if (!isScanning) return;
              setStatus('🔍 Escaneando... Apunta al código de barras');
            }, 2000);
          }
        } catch (error) {
          console.error('Error buscando producto en OpenFoodFacts:', error);
          setStatus(`⚠️ Error al buscar producto`);
          
          // Volver al estado de escaneo después de 2 segundos
          setTimeout(() => {
            if (!isScanning) return;
            setStatus('🔍 Escaneando... Apunta al código de barras');
          }, 2000);
        } finally {
          setIsSearchingProduct(false);
        }
      });

    } catch (error) {
      console.error('Error starting enhanced scanner:', error);
      setError('Error al acceder a la cámara. Verifica los permisos del navegador.');
      setStatus('Error');
      setIsSearchingProduct(false);
    }
  };

  const stopScanning = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).Quagga) {
        (window as any).Quagga.stop();
      }
      setStatus('Inactivo');
      setIsSearchingProduct(false);
      setLastFoundProduct(null);
      console.log('🛑 Scanner detenido');
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              {error || 'Scanner de códigos de barras no disponible en este dispositivo'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-green-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📷 Scanner + OpenFoodFacts
            <Badge variant="outline" className={`text-xs ${
              isScanning ? 'bg-green-50 text-green-700 border-green-300' : 
              'bg-gray-50 text-gray-700'
            }`}>
              {isScanning ? '🟢 Activo' : '⚪ Inactivo'}
            </Badge>
          </span>
          <Button
            onClick={onToggleScanning}
            variant={isScanning ? "destructive" : "default"}
            size="sm"
            disabled={isSearchingProduct}
            className={isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}
          >
            {isScanning ? '⏹️ Detener' : '📷 Escanear'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">
            <span className="text-gray-600">Estado:</span>{' '}
            <span className={
              isSearchingProduct ? 'text-blue-600' :
              isScanning ? 'text-green-600' : 
              error ? 'text-red-600' : 'text-gray-500'
            }>
              {status}
            </span>
          </p>
          
          {isSearchingProduct && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Consultando OpenFoodFacts...
            </Badge>
          )}
        </div>
          
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              ⚠️ {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Video Area */}
        <div className="relative border-2 border-dashed border-green-300 rounded-lg bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
          <div className="aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover rounded-lg ${isScanning ? 'block' : 'hidden'}`}
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {!isScanning && (
              <div className="text-center text-gray-600 p-8">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Scanner Inteligente
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Escanea códigos de barras y encuentra productos automáticamente
                </p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    🌍 OpenFoodFacts
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    📷 Scanner Integrado
                  </Badge>
                </div>
              </div>
            )}
            
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay con corners */}
                <div className="absolute inset-1/4 border-2 border-green-400 rounded-lg">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                </div>
                
                {/* Instructions overlay */}
                <div className="absolute top-4 left-4 right-4 text-center">
                  <div className="bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    📱 Posiciona el código dentro del marco
                  </div>
                </div>
                
                {/* Scanning animation */}
                <div className="absolute inset-1/4 overflow-hidden rounded-lg">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                  <div className="absolute inset-0 bg-green-400 bg-opacity-5 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Found Product Display */}
        {lastFoundProduct && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Product Image */}
                {lastFoundProduct.imageSmall && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-md bg-white flex-shrink-0">
                    <img
                      src={lastFoundProduct.imageSmall}
                      alt={lastFoundProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOUI5QkEzIj7wn429PC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                )}
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-green-800 text-sm mb-1">
                      ✅ Producto Encontrado
                    </h4>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs ml-2">
                      🌍 OpenFoodFacts
                    </Badge>
                  </div>
                  
                  <p className="font-bold text-gray-900 text-base mb-2 leading-tight">
                    {lastFoundProduct.name}
                  </p>
                  
                  {/* Nutritional Info */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-green-700">
                        {lastFoundProduct.gi}
                      </div>
                      <div className="text-xs text-gray-600">IG</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-blue-700">
                        {lastFoundProduct.carbs}g
                      </div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-orange-700">
                        {lastFoundProduct.kcal}
                      </div>
                      <div className="text-xs text-gray-600">Kcal</div>
                    </div>
                  </div>

                  {/* Additional Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {lastFoundProduct.brand && (
                      <Badge variant="secondary" className="text-xs">
                        🏷️ {lastFoundProduct.brand}
                      </Badge>
                    )}
                    {lastFoundProduct.nutriscore && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          lastFoundProduct.nutriscore === 'A' ? 'bg-green-100 text-green-800 border-green-300' :
                          lastFoundProduct.nutriscore === 'B' ? 'bg-lime-100 text-lime-800 border-lime-300' :
                          lastFoundProduct.nutriscore === 'C' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          lastFoundProduct.nutriscore === 'D' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        Nutri-Score {lastFoundProduct.nutriscore}
                      </Badge>
                    )}
                    {lastFoundProduct.density && (
                      <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-300">
                        💧 Líquido
                      </Badge>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onFoodFound(lastFoundProduct)}
                  >
                    ➕ Agregar a mi comida
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">
              🎯 Scanner Inteligente - Cómo Usar
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-blue-700">
              <div>
                <p className="font-medium mb-1">📱 Para escanear:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Mantén el dispositivo estable</li>
                  <li>Asegúrate de tener buena luz</li>
                  <li>Centra el código en el marco</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">🌍 Búsqueda automática:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Busca en +2M productos</li>
                  <li>Datos nutricionales reales</li>
                  <li>Imágenes del producto</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200">
              <div className="text-xs text-blue-600">
                💡 <strong>Tip:</strong> Los productos se agregan automáticamente cuando se encuentran
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}