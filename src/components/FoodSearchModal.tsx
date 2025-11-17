'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FoodItem } from '@/types/nutrition';
import { useFoodDatabase } from '@/hooks/useFoodDatabase';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem) => void;
  foods: FoodItem[];
}

interface FoodListItemProps {
  food: FoodItem;
  onSelect: () => void;
}

function FoodListItem({ food, onSelect }: FoodListItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors group"
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
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate group-hover:text-green-700">
          {food.name}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>IG: {food.gi}</span>
          <span>Carbs: {food.carbs}g</span>
          <span>Kcal: {food.kcal}</span>
          {food.density && <span>Líquido</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <Badge variant={food.gi > 70 ? 'destructive' : food.gi > 55 ? 'secondary' : 'default'}>
          IG {food.gi}
        </Badge>
        <div className="text-gray-400">
          →
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4 p-4 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 0}
        className="h-8 w-8 p-0"
      >
        ←
      </Button>
      
      <span className="text-sm text-gray-600 mx-2">
        {currentPage + 1} / {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="h-8 w-8 p-0"
      >
        →
      </Button>
    </div>
  );
}

export default function FoodSearchModal({ isOpen, onClose, onSelectFood, foods }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(searchResults.length / PAGE_SIZE);
  const paginatedResults = searchResults.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // Search function
  const searchFoods = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentPage(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = foods.filter(food =>
        food.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setCurrentPage(0);
      console.log(`🔍 Búsqueda "${query}": ${results.length} resultados`);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [foods]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchFoods(query);
    }, 300),
    [searchFoods]
  );

  // Execute search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentPage(0);
    }
  }, [isOpen]);

  const handleSelectFood = (food: FoodItem) => {
    onSelectFood(food);
    onClose();
    console.log(`✓ Alimento seleccionado: ${food.name}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[85vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-700">
            Selecciona alimento
          </DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="flex-shrink-0">
          <Input
            type="text"
            placeholder="🔍 Buscar alimentos... (ej: manzana, arroz, pollo)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-base"
            autoFocus
          />
          
          {/* Search status */}
          <div className="mt-2 text-sm text-gray-500">
            {isSearching && "Buscando..."}
            {!isSearching && searchResults.length > 0 && (
              `${searchResults.length} resultados encontrados`
            )}
            {!isSearching && searchQuery && searchResults.length === 0 && (
              "No se encontraron alimentos"
            )}
            {!searchQuery && "Escribe para buscar alimentos"}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-h-0">
          {paginatedResults.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-2 p-1">
                {paginatedResults.map((food, index) => (
                  <FoodListItem
                    key={`${food.name}-${currentPage}-${index}`}
                    food={food}
                    onSelect={() => handleSelectFood(food)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {!searchQuery ? (
                <div className="text-center space-y-2">
                  <div className="text-4xl">🔍</div>
                  <p>Escribe el nombre de un alimento para buscarlo</p>
                  <p className="text-sm">Base de datos: 320+ alimentos disponibles</p>
                </div>
              ) : isSearching ? (
                <div className="text-center space-y-2">
                  <div className="text-4xl animate-spin">⭕</div>
                  <p>Buscando alimentos...</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-4xl">😕</div>
                  <p>No se encontraron alimentos para "{searchQuery}"</p>
                  <p className="text-sm">Prueba con otros términos o revisa la ortografía</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}