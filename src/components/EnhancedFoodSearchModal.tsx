'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FoodItem } from '@/types/nutrition';
import { FoodItemWithImage } from '@/lib/openFoodFactsService';
import { useEnhancedFoodSearch } from '@/hooks/useEnhancedFoodSearch';

interface EnhancedFoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem | FoodItemWithImage) => void;
}

interface FoodListItemProps {
  food: FoodItem | FoodItemWithImage;
  onSelect: () => void;
}

function EnhancedFoodListItem({ food, onSelect }: FoodListItemProps) {
  const isOpenFoodFacts = 'source' in food && food.source === 'openfoodfacts';
  const foodWithImage = food as FoodItemWithImage;
  
  return (
    <div
      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors group"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
        {isOpenFoodFacts && foodWithImage.imageSmall ? (
          <img
            src={foodWithImage.imageSmall}
            alt={food.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.setAttribute('style', 'display: flex');
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center text-2xl ${
            isOpenFoodFacts && foodWithImage.imageSmall ? 'hidden' : 'flex'
          }`}
          style={{ display: isOpenFoodFacts && foodWithImage.imageSmall ? 'none' : 'flex' }}
        >
          🍽️
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate group-hover:text-green-700 flex-1">
            {food.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isOpenFoodFacts ? (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                🌍 OpenFoodFacts
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                💾 Local
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>IG: {food.gi}</span>
          <span>Carbs: {food.carbs}g</span>
          <span>Kcal: {food.kcal}</span>
          {food.density && <span>Líquido</span>}
        </div>

        {/* Additional info for OpenFoodFacts items */}
        {isOpenFoodFacts && (
          <div className="flex items-center gap-2 mt-1">
            {foodWithImage.brand && (
              <Badge variant="secondary" className="text-xs">
                {foodWithImage.brand}
              </Badge>
            )}
            {foodWithImage.nutriscore && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  foodWithImage.nutriscore === 'A' ? 'bg-green-100 text-green-800' :
                  foodWithImage.nutriscore === 'B' ? 'bg-lime-100 text-lime-800' :
                  foodWithImage.nutriscore === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  foodWithImage.nutriscore === 'D' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                Nutri-Score {foodWithImage.nutriscore}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <Badge variant={food.gi > 70 ? 'destructive' : food.gi > 55 ? 'secondary' : 'default'}>
          IG {food.gi}
        </Badge>
      </div>
    </div>
  );
}

export default function EnhancedFoodSearchModal({ 
  isOpen, 
  onClose, 
  onSelectFood 
}: EnhancedFoodSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { results, search, loadMore, isLoading, error } = useEnhancedFoodSearch({
    enableOpenFoodFacts: true,
    localFirst: true,
    pageSize: 15,
    minQueryLength: 2
  });

  // Auto-focus cuando se abre el modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Ejecutar búsqueda cuando cambia la query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query.trim());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  const handleSelectFood = (food: FoodItem | FoodItemWithImage) => {
    // Si es de OpenFoodFacts, convertir a formato local
    if ('source' in food && food.source === 'openfoodfacts') {
      const localFood: FoodItem = {
        name: food.name,
        gi: food.gi,
        carbs: food.carbs,
        kcal: food.kcal,
        ...(food.density && { density: food.density })
      };
      onSelectFood(localFood);
    } else {
      onSelectFood(food);
    }
    onClose();
    console.log(`✓ Alimento seleccionado: ${food.name} (Fuente: ${('source' in food) ? food.source : 'local'})`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Combinar resultados locales y de OpenFoodFacts
  const allResults = [
    ...results.localResults.map(food => ({ ...food, source: 'local' as const })),
    ...results.openFoodFactsResults
  ];

  const hasResults = allResults.length > 0;
  const showLoadMore = results.hasMore && !isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            🔍 Buscar Alimentos
            <Badge variant="outline" className="text-xs">
              Local + OpenFoodFacts
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="flex-shrink-0 space-y-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder="🔍 Buscar alimentos... (ej: manzana, coca cola, pan integral)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base h-12"
            autoFocus
          />
          
          {/* Search Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  Buscando en base de datos local y OpenFoodFacts...
                </div>
              )}
              {!isLoading && hasResults && (
                <div className="flex items-center gap-4">
                  <span>Total: {results.totalResults} resultados</span>
                  {results.localResults.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-50">
                      💾 {results.localResults.length} local
                    </Badge>
                  )}
                  {results.openFoodFactsResults.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      🌍 {results.openFoodFactsResults.length} OpenFoodFacts
                    </Badge>
                  )}
                </div>
              )}
              {!isLoading && query && !hasResults && (
                "No se encontraron alimentos"
              )}
              {!query && "Escribe para buscar en más de 2 millones de productos"}
            </div>
            
            {error && (
              <div className="text-red-500 text-xs">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 min-h-0">
          {hasResults ? (
            <ScrollArea className="h-full">
              <div className="space-y-2 p-1">
                {allResults.map((food, index) => (
                  <EnhancedFoodListItem
                    key={`${food.name}-${index}-${'source' in food ? food.source : 'local'}`}
                    food={food}
                    onSelect={() => handleSelectFood(food)}
                  />
                ))}
                
                {/* Load More Button */}
                {showLoadMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="w-full max-w-xs"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full mr-2"></div>
                          Cargando más...
                        </>
                      ) : (
                        'Cargar más resultados'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {!query ? (
                <div className="text-center space-y-4">
                  <div className="text-6xl">🍽️</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Búsqueda Inteligente</h3>
                    <p className="text-gray-600">Busca en nuestra base local de 320+ alimentos</p>
                    <p className="text-gray-600">+ más de 2 millones de productos de OpenFoodFacts</p>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      💾 Base Local
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      🌍 OpenFoodFacts
                    </Badge>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-pulse">🔍</div>
                  <div>
                    <p className="text-lg">Buscando "{query}"...</p>
                    <p className="text-sm text-gray-500">Consultando base local y OpenFoodFacts</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">😕</div>
                  <div>
                    <p className="text-lg">No se encontraron resultados</p>
                    <p className="text-gray-600">para "{query}"</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Prueba con otros términos o revisa la ortografía
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-500">
            💡 Tip: Los productos con imágenes vienen de OpenFoodFacts
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}