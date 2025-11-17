'use client';

import { useState, useCallback, useEffect } from 'react';

interface UseLocalStorageReturn {
  getValue: <T>(key: string) => T | null;
  setValue: <T>(key: string, value: T) => void;
  removeValue: (key: string) => void;
  clear: () => void;
  isAvailable: () => boolean;
}

interface UseLocalStorageValueReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  clearValue: () => void;
}

export function useLocalStorage(): UseLocalStorageReturn;
export function useLocalStorage<T>(key: string, defaultValue?: T): UseLocalStorageValueReturn<T>;
export function useLocalStorage<T>(key?: string, defaultValue?: T) {
  const [value, setStoredValue] = useState<T | null>(null);

  // Si no se proporciona key, devolver interfaz general
  if (!key) {
    return useLocalStorageGeneral();
  }

  // Si se proporciona key, devolver interfaz específica
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      } else if (defaultValue !== undefined) {
        setStoredValue(defaultValue);
      }
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      if (defaultValue !== undefined) {
        setStoredValue(defaultValue);
      }
    }
  }, [key, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    try {
      setStoredValue(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }, [key]);

  const clearValue = useCallback(() => {
    try {
      setStoredValue(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  }, [key]);

  return {
    value,
    setValue,
    clearValue
  };
}

function useLocalStorageGeneral(): UseLocalStorageReturn {
  
  const isAvailable = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getValue = useCallback(<T>(key: string): T | null => {
    if (!isAvailable()) return null;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error al leer de localStorage (${key}):`, error);
      return null;
    }
  }, [isAvailable]);

  const setValue = useCallback(<T>(key: string, value: T): void => {
    if (!isAvailable()) {
      console.warn('localStorage no está disponible');
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error al escribir en localStorage (${key}):`, error);
    }
  }, [isAvailable]);

  const removeValue = useCallback((key: string): void => {
    if (!isAvailable()) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error al eliminar de localStorage (${key}):`, error);
    }
  }, [isAvailable]);

  const clear = useCallback((): void => {
    if (!isAvailable()) return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }, [isAvailable]);

  return {
    getValue,
    setValue,
    removeValue,
    clear,
    isAvailable
  };
}