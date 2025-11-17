'use client';

import { useState, useEffect } from 'react';
import { FoodItem, Recipe } from '@/types/nutrition';
import { dbService } from '@/lib/indexedDBService';
import { foodTrie } from '@/lib/trieSearch';

interface UseFoodDatabaseReturn {
  foods: FoodItem[];
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  searchFoods: (query: string) => FoodItem[];
  getFoodByName: (name: string) => Promise<FoodItem | null>;
  addCustomFood: (food: FoodItem) => Promise<void>;
  deleteFoodByName: (name: string) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  getRecipeById: (id: string) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getStats: () => { foods: number; recipes: number; };
}

export function useFoodDatabase(): UseFoodDatabaseReturn {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Inicializar base de datos al montar
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar si IndexedDB está disponible
      if (typeof window === 'undefined') {
        console.log('IndexedDB no disponible en servidor');
        return;
      }

      console.log('Inicializando base de datos de alimentos...');

      // Inicializar con datos semilla
      await dbService.initializeWithSeedData();

      // Cargar todos los datos
      const [foodsData, recipesData] = await Promise.all([
        dbService.getAllAlimentos(),
        dbService.getAllRecetas()
      ]);

      setFoods(foodsData);
      setRecipes(recipesData);

      // Construir índice Trie para búsquedas
      console.log('Construyendo índice de búsqueda...');
      foodsData.forEach(food => {
        foodTrie.insert(food.name, food);
      });

      setInitialized(true);
      console.log(`✓ Base de datos inicializada: ${foodsData.length} alimentos, ${recipesData.length} recetas`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al inicializar base de datos';
      setError(errorMsg);
      console.error('Error inicializando base de datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchFoods = (query: string): FoodItem[] => {
    if (!query.trim()) return [];
    
    try {
      return foodTrie.intelligentSearch(query.trim(), 50);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      return [];
    }
  };

  const getFoodByName = async (name: string): Promise<FoodItem | null> => {
    try {
      return await dbService.getAlimento(name);
    } catch (err) {
      console.error(`Error obteniendo alimento ${name}:`, err);
      return null;
    }
  };

  const addCustomFood = async (food: FoodItem): Promise<void> => {
    try {
      await dbService.saveAlimento(food);
      
      // Actualizar estado local
      setFoods(prev => {
        const filtered = prev.filter(f => f.name !== food.name);
        return [...filtered, food].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Actualizar índice Trie
      foodTrie.insert(food.name, food);

      console.log(`✓ Alimento guardado: ${food.name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar alimento';
      setError(errorMsg);
      console.error('Error guardando alimento:', err);
      throw err;
    }
  };

  const deleteFoodByName = async (name: string): Promise<void> => {
    try {
      await dbService.deleteAlimento(name);
      
      // Actualizar estado local
      setFoods(prev => prev.filter(f => f.name !== name));

      // Reconstruir índice Trie (simplificado - en producción sería más eficiente)
      foodTrie.clear();
      foods.filter(f => f.name !== name).forEach(food => {
        foodTrie.insert(food.name, food);
      });

      console.log(`✓ Alimento eliminado: ${name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar alimento';
      setError(errorMsg);
      console.error('Error eliminando alimento:', err);
      throw err;
    }
  };

  const saveRecipe = async (recipe: Recipe): Promise<void> => {
    try {
      await dbService.saveReceta(recipe);
      
      // Actualizar estado local
      setRecipes(prev => {
        const filtered = prev.filter(r => r.id !== recipe.id);
        return [...filtered, recipe].sort((a, b) => a.name.localeCompare(b.name));
      });

      console.log(`✓ Receta guardada: ${recipe.name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar receta';
      setError(errorMsg);
      console.error('Error guardando receta:', err);
      throw err;
    }
  };

  const getRecipeById = async (id: string): Promise<Recipe | null> => {
    try {
      return await dbService.getReceta(id);
    } catch (err) {
      console.error(`Error obteniendo receta ${id}:`, err);
      return null;
    }
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    try {
      await dbService.deleteReceta(id);
      
      // Actualizar estado local
      setRecipes(prev => prev.filter(r => r.id !== id));

      console.log(`✓ Receta eliminada: ${id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar receta';
      setError(errorMsg);
      console.error('Error eliminando receta:', err);
      throw err;
    }
  };

  const refreshData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const [foodsData, recipesData] = await Promise.all([
        dbService.getAllAlimentos(),
        dbService.getAllRecetas()
      ]);

      setFoods(foodsData);
      setRecipes(recipesData);

      // Reconstruir índice Trie
      foodTrie.clear();
      foodsData.forEach(food => {
        foodTrie.insert(food.name, food);
      });

      console.log('✓ Datos actualizados');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar datos';
      setError(errorMsg);
      console.error('Error actualizando datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => ({
    foods: foods.length,
    recipes: recipes.length
  });

  return {
    foods,
    recipes,
    isLoading,
    error,
    initialized,
    searchFoods,
    getFoodByName,
    addCustomFood,
    deleteFoodByName,
    saveRecipe,
    getRecipeById,
    deleteRecipe,
    refreshData,
    getStats
  };
}