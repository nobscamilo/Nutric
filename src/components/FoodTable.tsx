'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodEntry } from '@/types/nutrition';

interface FoodTableProps {
  foods: FoodEntry[];
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemoveFood: (name: string) => void;
  className?: string;
}

interface TableRowItemProps {
  food: FoodEntry;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function TableRowItem({ food, onUpdateQuantity, onRemove }: TableRowItemProps) {
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
    <tr className="group hover:bg-green-50/30 transition-colors">
      <td className="font-medium text-green-700 max-w-[200px] truncate">
        <div className="flex items-center gap-2">
          <span title={food.name}>{food.name}</span>
        </div>
      </td>
      
      <td>
        <div className="flex items-center gap-1 max-w-[100px] justify-center">
          <Input
            type="number"
            value={isEditing ? quantity : food.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={handleQuantityBlur}
            onKeyDown={handleKeyPress}
            className="w-20 h-10 text-center border-gray-300 focus:border-green-500"
            min="0"
            step="0.1"
            aria-label={`Cantidad de ${food.name}`}
          />
          <span className="text-xs text-gray-500 ml-1">{unit}</span>
        </div>
      </td>
      
      <td className="text-center">
        <Badge variant={food.gi > 70 ? 'destructive' : food.gi > 55 ? 'secondary' : 'default'}>
          {food.gi}
        </Badge>
      </td>
      
      <td className="text-center font-mono">
        {food.carbs_g.toFixed(1)}
      </td>
      
      <td className="text-center">
        <Badge 
          variant={food.cg > 10 ? 'destructive' : food.cg > 5 ? 'secondary' : 'default'}
          className="font-mono"
        >
          {food.cg.toFixed(1)}
        </Badge>
      </td>
      
      <td className="text-center font-mono">
        {Math.round(food.kcal)}
      </td>
      
      <td className="text-center">
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 hover:bg-red-600"
          aria-label={`Eliminar ${food.name}`}
        >
          ✕
        </Button>
      </td>
    </tr>
  );
}

export default function FoodTable({ foods, onUpdateQuantity, onRemoveFood, className = '' }: FoodTableProps) {
  if (foods.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-gray-500 space-y-2">
          <div className="text-4xl">🍽️</div>
          <h3 className="text-lg font-medium">No hay alimentos agregados</h3>
          <p className="text-sm">
            Usa el buscador o el selector modal para agregar alimentos a tu comida
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg border-green-100 overflow-hidden ${className}`}>
      <div className="p-4 bg-green-50/50 border-b">
        <h3 className="font-semibold text-green-800">
          Alimentos ({foods.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="food-table w-full">
          <thead>
            <tr>
              <th>Alimento</th>
              <th>Cantidad</th>
              <th>IG</th>
              <th>Carbs (g)</th>
              <th>CG</th>
              <th>Kcal</th>
              <th>Quitar</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food, index) => (
              <TableRowItem
                key={`${food.name}-${index}`}
                food={food}
                onUpdateQuantity={(quantity) => onUpdateQuantity(food.name, quantity)}
                onRemove={() => onRemoveFood(food.name)}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table Summary Footer */}
      <div className="p-3 bg-gray-50 border-t text-sm text-gray-600">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <span>
            <strong>Total alimentos:</strong> {foods.length}
          </span>
          <span>
            <strong>CG total:</strong> {foods.reduce((sum, f) => sum + f.cg, 0).toFixed(2)}
          </span>
          <span>
            <strong>Kcal total:</strong> {Math.round(foods.reduce((sum, f) => sum + f.kcal, 0))}
          </span>
        </div>
      </div>
    </Card>
  );
}