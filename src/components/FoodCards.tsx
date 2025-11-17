'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodEntry } from '@/types/nutrition';

interface FoodCardsProps {
  foods: FoodEntry[];
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemoveFood: (name: string) => void;
  className?: string;
}

interface FoodCardItemProps {
  food: FoodEntry;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function FoodCardItem({ food, onUpdateQuantity, onRemove }: FoodCardItemProps) {
  const [quantity, setQuantity] = useState(food.quantity);
  const [isEditing, setIsEditing] = useState(false);

  const handleQuantityChange = useCallback((value: string) => {
    const newQuantity = parseFloat(value) || 0;
    setQuantity(newQuantity);
  }, []);

  const handleQuantityBlur = useCallback(() => {
    setIsEditing(false);
    onUpdateQuantity(quantity);
  }, [quantity, onUpdateQuantity]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantityBlur();
    }
    if (e.key === 'Escape') {
      setQuantity(food.quantity);
      setIsEditing(false);
    }
  }, [food.quantity, handleQuantityBlur]);

  // Determinar si es líquido para mostrar ml o g
  const unit = food.name.includes('Leche') || 
               food.name.includes('Zumo') || 
               food.name.includes('Batido') ||
               food.name.includes('Café') ||
               food.name.includes('Te') ||
               food.name.includes('Cerveza') ||
               food.name.includes('Vino') ||
               food.name.includes('Refresco') ? 'ml' : 'g';

  return (
    <Card className="w-full shadow-md border-green-100 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-green-700 text-base leading-tight flex-1 mr-2">
            {food.name}
          </h3>
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 flex-shrink-0"
            aria-label={`Eliminar ${food.name}`}
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Cantidad */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cantidad ({unit})
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={isEditing ? quantity : food.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={handleQuantityBlur}
                onKeyDown={handleKeyPress}
                className="w-full h-11 text-center border-gray-300 focus:border-green-500"
                min="0"
                step="0.1"
                aria-label={`Cantidad de ${food.name}`}
              />
            </div>
          </div>

          {/* IG */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              IG
            </div>
            <div className="flex items-center h-11">
              <Badge 
                variant={food.gi > 70 ? 'destructive' : food.gi > 55 ? 'secondary' : 'default'}
                className="text-base font-bold px-3 py-1"
              >
                {food.gi}
              </Badge>
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Carbs (g)
            </div>
            <div className="text-base font-semibold text-gray-900 bg-gray-50 rounded px-3 py-2 h-11 flex items-center">
              {food.carbs_g.toFixed(1)}
            </div>
          </div>

          {/* CG */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              CG
            </div>
            <div className="flex items-center h-11">
              <Badge 
                variant={food.cg > 10 ? 'destructive' : food.cg > 5 ? 'secondary' : 'default'}
                className="text-base font-bold px-3 py-1"
              >
                {food.cg.toFixed(1)}
              </Badge>
            </div>
          </div>

          {/* Kcal */}
          <div className="space-y-1 col-span-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Kilocalorías
            </div>
            <div className="text-lg font-bold text-gray-900 bg-green-50 rounded px-3 py-2 text-center">
              {Math.round(food.kcal)} kcal
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>CG/100g: {((food.cg / food.quantity) * 100).toFixed(1)}</span>
          <span>Kcal/100g: {((food.kcal / food.quantity) * 100).toFixed(0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FoodCards({ foods, onUpdateQuantity, onRemoveFood, className = '' }: FoodCardsProps) {
  if (foods.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="space-y-4 text-gray-500">
          <div className="text-6xl">🍽️</div>
          <h3 className="text-xl font-medium">No hay alimentos agregados</h3>
          <p className="text-sm max-w-sm mx-auto">
            Usa el buscador o el selector modal para agregar alimentos a tu comida
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="font-semibold text-green-800 text-lg">
          Alimentos ({foods.length})
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          CG total: {foods.reduce((sum, f) => sum + f.cg, 0).toFixed(2)} | 
          Kcal total: {Math.round(foods.reduce((sum, f) => sum + f.kcal, 0))}
        </div>
      </div>
      
      <div className="space-y-4">
        {foods.map((food, index) => (
          <FoodCardItem
            key={`${food.name}-${index}`}
            food={food}
            onUpdateQuantity={(quantity) => onUpdateQuantity(food.name, quantity)}
            onRemove={() => onRemoveFood(food.name)}
          />
        ))}
      </div>
      
      {/* Summary Card */}
      <Card className="mt-6 bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-700">
                {foods.reduce((sum, f) => sum + f.cg, 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">CG Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">
                {Math.round(foods.reduce((sum, f) => sum + f.kcal, 0))}
              </div>
              <div className="text-sm text-gray-600">Kcal Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}