'use client';

import { useMemo } from 'react';
import { 
  FoodItem,
  FoodEntry, 
  NutritionalSummary, 
  UserProfile,
  ProgressBarData
} from '@/types/nutrition';

interface UseNutritionalCalculationsReturn {
  calculateFoodEntry: (food: FoodItem, quantity: number) => FoodEntry;
  calculateSummary: (foods: FoodEntry[], profile?: UserProfile) => NutritionalSummary;
  getProgressBarData: (value: number, type: 'cg' | 'ire' | 'vg') => ProgressBarData;
}

export function useNutritionalCalculations(): UseNutritionalCalculationsReturn {
  const calculateFoodEntry = useMemo(() => (food: FoodItem, quantity: number): FoodEntry => {
    const unitMl = !!food.density;
    const grams = unitMl ? quantity * (food.density || 1) : quantity;
    const carbs_g = grams * (food.carbs / 100);
    const cg = (food.gi * carbs_g) / 100;
    const kcal = grams * (food.kcal / 100);

    return {
      name: food.name,
      quantity,
      gi: food.gi,
      carbs_g,
      cg,
      kcal
    };
  }, []);

  const calculateSummary = useMemo(() => (foods: FoodEntry[], profile?: UserProfile): NutritionalSummary => {
    if (!foods || foods.length === 0) {
      return {
        totalCG: 0,
        totalKcal: 0,
        totalCarbs: 0,
        weightedGI: 0,
        ire: 0,
        vg: 0
      };
    }

    const totalCG = foods.reduce((sum, food) => sum + food.cg, 0);
    const totalKcal = foods.reduce((sum, food) => sum + food.kcal, 0);
    const totalCarbs = foods.reduce((sum, food) => sum + food.carbs_g, 0);
    
    // IG ponderado por carbohidratos
    const weightedGI = totalCarbs > 0 
      ? foods.reduce((sum, food) => sum + (food.gi * food.carbs_g), 0) / totalCarbs
      : 0;

    // IRE - Índice de Respuesta Estimada (CG / kg peso corporal)
    const peso = profile?.peso || 70;
    const ire = peso > 0 ? totalCG / peso : 0;

    // VG - Valor Glucémico (CG / Kcal × 100)
    const vg = totalKcal > 0 ? (totalCG / totalKcal) * 100 : 0;

    return {
      totalCG: Math.round(totalCG * 100) / 100,
      totalKcal: Math.round(totalKcal * 100) / 100,
      totalCarbs: Math.round(totalCarbs * 100) / 100,
      weightedGI: Math.round(weightedGI * 10) / 10,
      ire: Math.round(ire * 100) / 100,
      vg: Math.round(vg * 100) / 100
    };
  }, []);

  const getProgressBarData = useMemo(() => (value: number, type: 'cg' | 'ire' | 'vg'): ProgressBarData => {
    let max: number;
    let level: 'low' | 'medium' | 'high';
    
    if (type === 'cg') {
      max = 100;
      if (value < 20) level = 'low';
      else if (value < 50) level = 'medium';
      else level = 'high';
    } else if (type === 'ire') {
      max = 2;
      if (value < 0.7) level = 'low';
      else if (value < 1.2) level = 'medium';
      else level = 'high';
    } else { // vg
      max = 50;
      if (value < 10) level = 'low';
      else if (value < 25) level = 'medium';
      else level = 'high';
    }

    const percentage = Math.min(100, (value / max) * 100);
    const color = level === 'low' ? '#22c55e' : level === 'medium' ? '#eab308' : '#ef4444';

    return {
      value,
      max,
      percentage,
      level,
      color
    };
  }, []);

  return {
    calculateFoodEntry,
    calculateSummary,
    getProgressBarData
  };
}