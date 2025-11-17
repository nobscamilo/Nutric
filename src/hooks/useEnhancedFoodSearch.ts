'use client';

import { useState, useCallback } from 'react';
import { FoodItem } from '@/types/nutrition';
import { OpenFoodFactsService, FoodItemWithImage } from '@/lib/openFoodFactsService';
import { useFoodDatabase } from './useFoodDatabase';

export interface EnhancedFoodSearchResult {
  localResults: FoodItem[];
  openFoodFactsResults: FoodItemWithImage[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  totalResults: number;
}

interface UseEnhancedFoodSearchOptions {
  enableOpenFoodFacts?: boolean;
  localFirst?: boolean;
  pageSize?: number;
  minQueryLength?: number;
}

export function useEnhancedFoodSearch(options: UseEnhancedFoodSearchOptions = {}) {
  const {
    enableOpenFoodFacts = true,
    localFirst = true,
    pageSize = 20,
    minQueryLength = 2
  } = options;

  const { searchFoods: searchLocalFoods } = useFoodDatabase();
  
  const [results, setResults] = useState<EnhancedFoodSearchResult>({
    localResults: [],
    openFoodFactsResults: [],
    isLoading: false,
    hasMore: false,
    error: null,
    totalResults: 0
  });

  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Resetear resultados cuando cambia la query
  const resetResults = useCallback(() => {
    setResults({
      localResults: [],
      openFoodFactsResults: [],
      isLoading: false,
      hasMore: false,
      error: null,
      totalResults: 0
    });
    setCurrentPage(1);
  }, []);

  // Búsqueda local
  const searchLocal = useCallback(async (query: string) => {
    try {
      const localResults = searchLocalFoods(query);
      return localResults.slice(0, pageSize);
    } catch (error) {
      console.error('Error en búsqueda local:', error);
      return [];
    }
  }, [searchLocalFoods, pageSize]);

  // Búsqueda en OpenFoodFacts
  const searchOpenFoodFacts = useCallback(async (query: string, page: number = 1) => {
    if (!enableOpenFoodFacts) return { products: [], hasMore: false, totalCount: 0 };

    try {
      const response = await OpenFoodFactsService.searchProducts(query, page, pageSize);
      return {
        products: response.products,
        hasMore: response.hasMore,
        totalCount: response.totalCount
      };
    } catch (error) {
      console.error('Error en búsqueda OpenFoodFacts:', error);
      return { products: [], hasMore: false, totalCount: 0 };
    }
  }, [enableOpenFoodFacts, pageSize]);

  // Función principal de búsqueda
  const search = useCallback(async (query: string, append: boolean = false) => {
    if (!query || query.trim().length < minQueryLength) {
      resetResults();
      return;
    }

    const trimmedQuery = query.trim();
    const isNewQuery = trimmedQuery !== currentQuery;
    
    if (isNewQuery) {
      resetResults();
      setCurrentQuery(trimmedQuery);
    }

    const page = isNewQuery ? 1 : currentPage + (append ? 1 : 0);

    setResults(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let localResults: FoodItem[] = [];
      let openFoodFactsData = { products: [] as FoodItemWithImage[], hasMore: false, totalCount: 0 };

      if (localFirst && (isNewQuery || !append)) {
        // Búsqueda local primero (solo en nueva query o primera página)
        localResults = await searchLocal(trimmedQuery);
      }

      if (enableOpenFoodFacts) {
        // Búsqueda en OpenFoodFacts
        openFoodFactsData = await searchOpenFoodFacts(trimmedQuery, page);
      }

      setResults(prev => ({
        localResults: isNewQuery ? localResults : prev.localResults,
        openFoodFactsResults: append && !isNewQuery 
          ? [...prev.openFoodFactsResults, ...openFoodFactsData.products]
          : openFoodFactsData.products,
        isLoading: false,
        hasMore: openFoodFactsData.hasMore,
        error: null,
        totalResults: localResults.length + openFoodFactsData.totalCount
      }));

      if (append && !isNewQuery) {
        setCurrentPage(page);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la búsqueda';
      setResults(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [currentQuery, currentPage, minQueryLength, enableOpenFoodFacts, localFirst, searchLocal, searchOpenFoodFacts, resetResults]);

  // Cargar más resultados
  const loadMore = useCallback(() => {
    if (results.hasMore && !results.isLoading) {
      search(currentQuery, true);
    }
  }, [results.hasMore, results.isLoading, currentQuery, search]);

  // Búsqueda por código de barras
  const searchByBarcode = useCallback(async (barcode: string): Promise<FoodItemWithImage | null> => {
    if (!enableOpenFoodFacts) return null;

    setResults(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await OpenFoodFactsService.getProductByBarcode(barcode);
      
      setResults(prev => ({ ...prev, isLoading: false }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar por código';
      setResults(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, [enableOpenFoodFacts]);

  // Obtener todas las sugerencias combinadas
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < minQueryLength) return [];

    try {
      const localResults = searchLocalFoods(query.trim()).slice(0, 3);
      const localSuggestions = localResults.map(item => item.name);

      let openFoodFactsSuggestions: string[] = [];
      if (enableOpenFoodFacts) {
        openFoodFactsSuggestions = await OpenFoodFactsService.getSuggestions(query.trim());
      }

      // Combinar y eliminar duplicados
      const allSuggestions = [...localSuggestions, ...openFoodFactsSuggestions];
      const uniqueSuggestions = Array.from(new Set(allSuggestions));
      
      return uniqueSuggestions.slice(0, 8);
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return [];
    }
  }, [searchLocalFoods, enableOpenFoodFacts, minQueryLength]);

  // Obtener productos populares
  const getPopularProducts = useCallback(async (): Promise<FoodItemWithImage[]> => {
    if (!enableOpenFoodFacts) return [];

    try {
      const { products } = await OpenFoodFactsService.searchProducts('', 1, 10);
      return products;
    } catch (error) {
      console.error('Error obteniendo productos populares:', error);
      return [];
    }
  }, [enableOpenFoodFacts]);

  return {
    results,
    search,
    loadMore,
    searchByBarcode,
    getSuggestions,
    getPopularProducts,
    resetResults,
    isLoading: results.isLoading,
    error: results.error
  };
}