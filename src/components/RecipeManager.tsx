'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Recipe, RecipeItem, FoodEntry } from '@/types/nutrition';

interface RecipeManagerProps {
  currentFoods: FoodEntry[];
  onLoadRecipe: (items: RecipeItem[]) => void;
  className?: string;
}

export default function RecipeManager({ 
  currentFoods, 
  onLoadRecipe, 
  className = '' 
}: RecipeManagerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('none');
  const [newRecipeName, setNewRecipeName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  // IndexedDB operations
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('glucemica_web_v2', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('recipes')) {
          db.createObjectStore('recipes', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getAllRecipes = async (): Promise<Recipe[]> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['recipes'], 'readonly');
      const store = transaction.objectStore('recipes');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  };

  const saveRecipe = async (recipe: Recipe): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(['recipes'], 'readwrite');
    const store = transaction.objectStore('recipes');
    
    return new Promise((resolve, reject) => {
      const request = store.put(recipe);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(['recipes'], 'readwrite');
    const store = transaction.objectStore('recipes');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedRecipes = await getAllRecipes();
      setRecipes(loadedRecipes);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Error al cargar plantillas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!newRecipeName.trim()) {
      setError('Ingresa un nombre para la plantilla');
      return;
    }

    if (currentFoods.length === 0) {
      setError('No hay alimentos para guardar en la plantilla');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const items: RecipeItem[] = currentFoods.map(food => ({
        name: food.name,
        qty: food.quantity
      }));

      const recipe: Recipe = {
        id: Date.now().toString(),
        name: newRecipeName.trim(),
        items,
        created: new Date().toISOString()
      };

      await saveRecipe(recipe);
      await loadRecipes();
      
      setNewRecipeName('');
      setIsSaveDialogOpen(false);
      setError(null);
      
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Error al guardar la plantilla');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadRecipe = async () => {
    if (!selectedRecipeId || selectedRecipeId === 'none') {
      setError('Selecciona una plantilla para cargar');
      return;
    }

    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (!recipe) {
      setError('Plantilla no encontrada');
      return;
    }

    try {
      setError(null);
      onLoadRecipe(recipe.items);
      setIsLoadDialogOpen(false);
      setSelectedRecipeId('none');
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Error al cargar la plantilla');
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await deleteRecipe(recipeId);
      await loadRecipes();
      if (selectedRecipeId === recipeId) {
        setSelectedRecipeId('none');
      }
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Error al eliminar la plantilla');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId && selectedRecipeId !== 'none');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>📖 Recetas / Plantillas</CardTitle>
        <CardDescription>
          Guarda y carga combinaciones de alimentos como plantillas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Save Recipe Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                  disabled={currentFoods.length === 0}
                >
                  💾 Guardar plantilla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Guardar Plantilla</DialogTitle>
                  <DialogDescription>
                    Guarda los alimentos actuales como una plantilla reutilizable
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipeName">Nombre de la plantilla</Label>
                    <Input
                      id="recipeName"
                      value={newRecipeName}
                      onChange={(e) => setNewRecipeName(e.target.value)}
                      placeholder="Ej: Desayuno proteico"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Alimentos incluidos ({currentFoods.length})</Label>
                    <ScrollArea className="h-32 mt-2 p-3 border rounded-lg">
                      {currentFoods.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay alimentos agregados</p>
                      ) : (
                        <div className="space-y-2">
                          {currentFoods.map((food, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="font-medium">{food.name}</span>
                              <Badge variant="secondary">{food.quantity}g</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSaveDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveRecipe}
                    disabled={isLoading || !newRecipeName.trim() || currentFoods.length === 0}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Recipe Selector */}
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="-- Selecciona plantilla --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Selecciona plantilla --</SelectItem>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.items.length} alimentos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Load Recipe Dialog */}
            <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!selectedRecipeId || selectedRecipeId === 'none' || isLoading}
                  className="flex-1 sm:flex-none"
                >
                  📂 Cargar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cargar Plantilla</DialogTitle>
                  <DialogDescription>
                    {selectedRecipe ? 
                      `¿Cargar "${selectedRecipe.name}"? Esto reemplazará los alimentos actuales.` :
                      'Selecciona una plantilla para cargar'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                {selectedRecipe && (
                  <div className="space-y-4">
                    <div>
                      <Label>Plantilla seleccionada</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{selectedRecipe.name}</span>
                          <Badge>{selectedRecipe.items.length} alimentos</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Creada: {new Date(selectedRecipe.created).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Alimentos incluidos</Label>
                      <ScrollArea className="h-32 mt-2 p-3 border rounded-lg">
                        <div className="space-y-2">
                          {selectedRecipe.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="font-medium">{item.name}</span>
                              <Badge variant="secondary">{item.qty}g</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {currentFoods.length > 0 && (
                      <Alert>
                        <AlertDescription>
                          ⚠️ Los {currentFoods.length} alimentos actuales serán reemplazados por esta plantilla.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsLoadDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  {selectedRecipe && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                      disabled={isLoading}
                      className="mr-auto"
                    >
                      🗑️ Eliminar
                    </Button>
                  )}
                  <Button 
                    onClick={handleLoadRecipe}
                    disabled={isLoading || !selectedRecipe}
                  >
                    {isLoading ? 'Cargando...' : 'Cargar plantilla'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recipe Summary */}
          {recipes.length > 0 && (
            <div>
              <Separator className="mb-3" />
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Plantillas disponibles ({recipes.length})
                </Label>
                <ScrollArea className="h-20">
                  <div className="flex flex-wrap gap-1">
                    {recipes.map((recipe) => (
                      <Badge 
                        key={recipe.id}
                        variant={selectedRecipeId === recipe.id ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedRecipeId(recipe.id)}
                      >
                        {recipe.name}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {recipes.length === 0 && !isLoading && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No hay plantillas guardadas</p>
              <p className="text-xs mt-1">
                Agrega alimentos y guarda tu primera plantilla
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}