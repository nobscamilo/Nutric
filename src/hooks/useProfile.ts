'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/nutrition';
import { useLocalStorage } from './useLocalStorage';

interface UseProfileReturn {
  profile: UserProfile | null;
  isCollapsed: boolean;
  loading: boolean;
  error: string | null;
  saveProfile: (newProfile: UserProfile) => void;
  loadProfile: () => UserProfile | null;
  clearProfile: () => void;
  toggleCollapsed: () => void;
  getProfileInfo: () => string;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getValue, setValue, removeValue } = useLocalStorage();

  // Cargar perfil al inicializar
  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-collapse en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsCollapsed(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    try {
      setLoading(true);
      setError(null);

      // Validar datos
      if (!newProfile.nombre?.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!newProfile.edad || newProfile.edad < 1 || newProfile.edad > 120) {
        throw new Error('Edad debe estar entre 1 y 120 años');
      }
      if (!newProfile.peso || newProfile.peso < 20 || newProfile.peso > 300) {
        throw new Error('Peso debe estar entre 20 y 300 kg');
      }
      if (!newProfile.talla || newProfile.talla < 100 || newProfile.talla > 250) {
        throw new Error('Talla debe estar entre 100 y 250 cm');
      }

      // Limpiar y normalizar datos
      const cleanProfile: UserProfile = {
        nombre: newProfile.nombre.trim(),
        sexo: newProfile.sexo || 'M',
        edad: Math.round(newProfile.edad),
        peso: Math.round(newProfile.peso * 10) / 10, // Redondear a 1 decimal
        talla: Math.round(newProfile.talla)
      };

      setValue('perfilUsuario', cleanProfile);
      setProfile(cleanProfile);
      
      console.log('✓ Perfil guardado:', cleanProfile);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar perfil';
      setError(errorMsg);
      console.error('Error guardando perfil:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = (): UserProfile | null => {
    try {
      setLoading(true);
      setError(null);
      
      const savedProfile = getValue<UserProfile>('perfilUsuario');
      
      if (savedProfile) {
        // Validar estructura del perfil guardado
        if (savedProfile.nombre && savedProfile.edad && savedProfile.peso && savedProfile.talla) {
          setProfile(savedProfile);
          console.log('✓ Perfil cargado:', savedProfile);
          return savedProfile;
        } else {
          console.warn('Perfil guardado incompleto, limpiando...');
          removeValue('perfilUsuario');
          setProfile(null);
          return null;
        }
      } else {
        setProfile(null);
        console.log('No hay perfil guardado');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar perfil';
      setError(errorMsg);
      console.error('Error cargando perfil:', errorMsg);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearProfile = () => {
    try {
      setError(null);
      removeValue('perfilUsuario');
      setProfile(null);
      console.log('✓ Perfil eliminado');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al limpiar perfil';
      setError(errorMsg);
      console.error('Error limpiando perfil:', errorMsg);
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  const getProfileInfo = (): string => {
    if (!profile) {
      return 'Sin perfil guardado';
    }

    const { nombre, edad, peso, sexo } = profile;
    return `Perfil: ${nombre}, ${edad} años, ${peso} kg (${sexo === 'M' ? 'Masculino' : 'Femenino'})`;
  };

  return {
    profile,
    isCollapsed,
    loading,
    error,
    saveProfile,
    loadProfile,
    clearProfile,
    toggleCollapsed,
    getProfileInfo
  };
}