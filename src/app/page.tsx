'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProfilePanel from '@/components/ProfilePanel';
import FoodTable from '@/components/FoodTable';
import FoodCards from '@/components/FoodCards';
import NutritionalSummary from '@/components/NutritionalSummary';
import EnhancedFoodSearchModal from '@/components/EnhancedFoodSearchModal';
import EnhancedBarcodeScanner from '@/components/EnhancedBarcodeScanner';
import RecipeManager from '@/components/RecipeManager';
import ExportControls from '@/components/ExportControls';
import { useFoodDatabase } from '@/hooks/useFoodDatabase';
import { useProfile } from '@/hooks/useProfile';
import { useNutritionalCalculations } from '@/hooks/useNutritionalCalculations';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { OpenFoodFactsService, FoodItemWithImage } from '@/lib/openFoodFactsService';
import type { FoodItem, FoodEntry, UserProfile, MealType, RecipeItem } from '@/types/nutrition';

export default function CalculadoraGlucemica() {
  const { foods, searchFoods, getFoodByName, isLoading: dbLoading, error: dbError } = useFoodDatabase();
  const { profile, saveProfile, loadProfile } = useProfile();
  const { calculateFoodEntry, calculateSummary } = useNutritionalCalculations();
  const { value: mealType, setValue: setMealType } = useLocalStorage<MealType>('mealType', 'Desayuno');
  
  // Estados principales
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Detectar viewport móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsProfileCollapsed(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ocultar mensaje de bienvenida después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar perfil al inicializar
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const addFood = useCallback(async (foodName: string, quantity: number = 100) => {
    try {
      // Buscar alimento en la base de datos
      let food = await getFoodByName(foodName);
      
      // Si no se encuentra, buscar en los resultados de búsqueda
      if (!food) {
        const searchResults = searchFoods(foodName);
        food = searchResults[0] || null;
      }

      if (!food) {
        alert(`No se encontró el alimento: ${foodName}`);
        return;
      }

      // Calcular valores nutricionales
      const foodEntry = calculateFoodEntry(food, quantity);
      
      // Agregar a la lista
      setFoodEntries(prev => [...prev, foodEntry]);
      
      console.log(`✓ Alimento agregado: ${foodEntry.name} (${quantity}g)`);
    } catch (error) {
      console.error('Error agregando alimento:', error);
      alert('Error al agregar el alimento');
    }
  }, [getFoodByName, searchFoods, calculateFoodEntry]);

  const handleSearchAdd = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      alert('Escribe el nombre de un alimento');
      return;
    }

    await addFood(query);
    setSearchQuery('');
  }, [searchQuery, addFood]);

  // Manejar selección desde modal (local o OpenFoodFacts)
  const handleModalSelect = useCallback((food: FoodItem | FoodItemWithImage) => {
    const entry = calculateFoodEntry(food, 100);
    setFoodEntries(prev => [...prev, entry]);
    setIsModalOpen(false);
    
    const source = 'source' in food ? food.source : 'local';
    console.log(`✓ Alimento seleccionado: ${food.name} (Fuente: ${source})`);
  }, [calculateFoodEntry]);

  // Manejar producto encontrado por scanner
  const handleFoodFoundByBarcode = useCallback((food: FoodItemWithImage) => {
    const entry = calculateFoodEntry(food, 100);
    setFoodEntries(prev => [...prev, entry]);
    console.log(`✓ Producto agregado por scanner: ${food.name}`);
    setScannerOpen(false); // Cerrar scanner automáticamente
  }, [calculateFoodEntry]);

  const handleUpdateQuantity = useCallback((name: string, quantity: number) => {
    setFoodEntries(prev => {
      return prev.map(entry => {
        if (entry.name === name && quantity >= 0) {
          // Encontrar el alimento original
          const originalFood = foods.find(f => f.name === name);
          if (originalFood) {
            return calculateFoodEntry(originalFood, quantity);
          }
        }
        return entry;
      });
    });
  }, [foods, calculateFoodEntry]);

  const handleRemoveFood = useCallback((name: string) => {
    setFoodEntries(prev => prev.filter(entry => entry.name !== name));
  }, []);

  const handleClearAll = useCallback(() => {
    if (foodEntries.length === 0) return;
    
    if (confirm('¿Seguro que quieres limpiar toda la tabla?')) {
      setFoodEntries([]);
      console.log('✓ Tabla limpiada');
    }
  }, [foodEntries.length]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchAdd();
    }
  }, [handleSearchAdd]);

  // Handlers para scanner y recetas
  const handleScanResult = useCallback((result: any) => {
    console.log('Código escaneado:', result.code);
    alert(`Código escaneado: ${result.code}\n(Función de búsqueda por implementar)`);
    setScannerOpen(false);
  }, []);

  const handleLoadRecipe = useCallback((items: RecipeItem[]) => {
    if (confirm('¿Cargar esta plantilla? Esto reemplazará los alimentos actuales.')) {
      setFoodEntries([]);
      setTimeout(() => {
        items.forEach(item => {
          addFood(item.name, item.qty);
        });
      }, 100);
    }
  }, [addFood]);

  // Calcular resumen nutricional
  const nutritionalSummary = calculateSummary(foodEntries, profile || undefined);

  // Mostrar loading inicial
  if (dbLoading && foods.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🍎</div>
          <h2 className="text-2xl font-bold text-green-700">Cargando Calculadora Glucémica</h2>
          <p className="text-gray-600">Inicializando base de datos...</p>
          <div className="animate-spin text-2xl">⭕</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-4 max-w-6xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600 flex items-center gap-2">
              <span className="text-3xl">🍎</span>
              Calculadora Glucémica
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Control nutricional inteligente — PWA Web
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:inline-flex"
              onClick={() => console.log('🧪 Ejecutando tests...', { foods: foodEntries.length, profile: profile?.nombre })}
            >
              <span className="mr-1">🧪</span>
              Tests
            </Button>
          </div>
        </header>

        {/* Welcome Message */}
        {showWelcome && foods.length > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription>
              <strong>✨ Bienvenido a Calculadora Glucémica</strong><br />
              Base de datos inicializada con {foods.length} alimentos disponibles<br />
              {profile ? `Perfil activo: ${profile.nombre}` : 'Configura tu perfil para cálculos personalizados'}
            </AlertDescription>
          </Alert>
        )}

        {/* Database Error */}
        {dbError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <strong>Error de base de datos:</strong> {dbError}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Panel */}
        <ProfilePanel 
          profile={profile || undefined}
          onSaveProfile={saveProfile}
          onLoadProfile={loadProfile}
          isCollapsed={isProfileCollapsed}
          onToggleCollapse={() => setIsProfileCollapsed(!isProfileCollapsed)}
        />

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md border border-green-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={mealType || 'Desayuno'} onValueChange={(value: MealType) => setMealType(value)}>
              <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Desayuno">Desayuno</SelectItem>
                <SelectItem value="Merienda">Merienda</SelectItem>
                <SelectItem value="Comida">Comida</SelectItem>
                <SelectItem value="Cena">Cena</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="🔍 Buscar alimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[44px]"
              disabled={foods.length === 0}
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSearchAdd}
                disabled={!searchQuery.trim() || foods.length === 0}
                className="min-h-[44px] flex items-center gap-2"
              >
                <span>➕</span>
                Agregar
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                disabled={foods.length === 0}
                className="min-h-[44px] flex items-center gap-2"
              >
                <span>📋</span>
                {isMobile ? 'Lista' : 'Selector'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setScannerOpen(true)}
                className="min-h-[44px] flex items-center gap-2"
              >
                <span>📷</span>
                {isMobile ? 'Scan' : 'Escanear'}
              </Button>

              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={foodEntries.length === 0}
                className="min-h-[44px] flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <span>🗑️</span>
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Food List */}
        {isMobile ? (
          <FoodCards
            foods={foodEntries}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFood={handleRemoveFood}
            className="mb-6"
          />
        ) : (
          <FoodTable
            foods={foodEntries}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFood={handleRemoveFood}
            className="mb-6"
          />
        )}

        {/* Nutritional Summary */}
        <NutritionalSummary 
          summary={nutritionalSummary} 
          profile={profile || undefined} 
          className="mb-6"
        />

        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow-md border border-green-100 p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-3">📊 Exportar Datos</h3>
          <ExportControls
            foods={foodEntries}
            summary={nutritionalSummary}
            profile={profile || undefined}
            mealType={mealType || 'Desayuno'}
          />
        </div>

        {/* Recipe Manager */}
        <RecipeManager
          currentFoods={foodEntries}
          onLoadRecipe={handleLoadRecipe}
          className="mb-6"
        />

        {/* Enhanced Scanner Modal */}
        {isScannerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-700">📷 Scanner + OpenFoodFacts</h3>
                <Button
                  variant="ghost"
                  onClick={() => setScannerOpen(false)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <EnhancedBarcodeScanner
                  onScanResult={handleScanResult}
                  onFoodFound={handleFoodFoundByBarcode}
                  isScanning={true}
                  onToggleScanning={() => setScannerOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Food Search Modal */}
        <EnhancedFoodSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectFood={handleModalSelect}
        />

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          <div className="bg-white rounded-full px-4 py-2 inline-block shadow-sm">
            powered by <strong>Sarmiento</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}