import { 
  FoodItem, 
  FoodEntry, 
  NutritionalSummary, 
  UserProfile,
  ProgressBarData,
  CLASIFICACION_CG,
  CLASIFICACION_IRE,
  CLASIFICACION_VG 
} from '@/types/nutrition';

export class NutritionalCalculations {
  
  /**
   * Calcula los valores nutricionales de un alimento según la cantidad
   */
  static calculateFoodEntry(food: FoodItem, quantity: number): FoodEntry {
    const isLiquid = !!food.density;
    const grams = isLiquid ? quantity * (food.density || 1) : quantity;
    
    const carbs_g = grams * (food.carbs / 100);
    const cg = (food.gi * carbs_g) / 100;
    const kcal = grams * (food.kcal / 100);

    return {
      name: food.name,
      quantity: quantity,
      gi: food.gi,
      carbs_g: this.round(carbs_g, 2),
      cg: this.round(cg, 2),
      kcal: this.round(kcal, 1)
    };
  }

  /**
   * Calcula el resumen nutricional total de una lista de alimentos
   */
  static calculateSummary(
    foods: FoodEntry[], 
    profile?: UserProfile
  ): NutritionalSummary {
    let totalCG = 0;
    let totalKcal = 0;
    let totalCarbs = 0;
    let weightedGI_numerator = 0;

    // Sumar todos los valores
    foods.forEach(food => {
      totalCG += food.cg;
      totalKcal += food.kcal;
      totalCarbs += food.carbs_g;
      weightedGI_numerator += (food.gi * food.carbs_g);
    });

    // Calcular IG ponderado
    const weightedGI = totalCarbs > 0 ? (weightedGI_numerator / totalCarbs) : 0;

    // Calcular IRE (Índice de Respuesta Estimada)
    const weight = profile?.peso || 70; // Peso por defecto 70kg
    const ire = weight > 0 ? (totalCG / weight) : 0;

    // Calcular VG (Valor Glucémico)
    const vg = totalKcal > 0 ? ((totalCG / totalKcal) * 100) : 0;

    return {
      totalCG: this.round(totalCG, 2),
      totalKcal: Math.round(totalKcal),
      totalCarbs: this.round(totalCarbs, 2),
      weightedGI: this.round(weightedGI, 1),
      ire: this.round(ire, 2),
      vg: this.round(vg, 2)
    };
  }

  /**
   * Configuración para barra de Carga Glucémica
   */
  static getProgressBarData(value: number, type: 'cg' | 'ire' | 'vg'): ProgressBarData {
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
  }

  /**
   * Calcula el IMC (Índice de Masa Corporal)
   */
  static calculateBMI(weight: number, height: number): number {
    if (weight <= 0 || height <= 0) return 0;
    const heightMts = height / 100;
    return this.round(weight / (heightMts * heightMts), 1);
  }

  /**
   * Calcula el TMB (Tasa Metabólica Basal) usando fórmula Harris-Benedict
   */
  static calculateBMR(profile: UserProfile): number {
    const { sexo, edad, peso, talla } = profile;
    
    if (peso <= 0 || talla <= 0 || edad <= 0) return 0;

    let bmr: number;
    if (sexo === 'M') {
      bmr = 88.362 + (13.397 * peso) + (4.799 * talla) - (5.677 * edad);
    } else {
      bmr = 447.593 + (9.247 * peso) + (3.098 * talla) - (4.330 * edad);
    }

    return Math.round(bmr);
  }

  /**
   * Obtiene recomendaciones nutricionales basadas en el resumen
   */
  static getRecommendations(summary: NutritionalSummary): string[] {
    const recommendations: string[] = [];

    // Recomendaciones para CG
    if (summary.totalCG > CLASIFICACION_CG.MEDIA) {
      recommendations.push('🔴 Carga glucémica alta. Considera reducir carbohidratos o elegir alimentos con menor IG.');
    } else if (summary.totalCG > CLASIFICACION_CG.BAJA) {
      recommendations.push('🟡 Carga glucémica moderada. Equilibrio aceptable.');
    } else {
      recommendations.push('🟢 Carga glucémica baja. Excelente para el control glucémico.');
    }

    // Recomendaciones para IG ponderado
    if (summary.weightedGI > 70) {
      recommendations.push('⚠️ IG ponderado alto. Incluye más alimentos de bajo IG.');
    } else if (summary.weightedGI > 55) {
      recommendations.push('📊 IG ponderado moderado.');
    } else {
      recommendations.push('✅ IG ponderado bajo. Ideal para control glucémico.');
    }

    // Recomendaciones para IRE
    if (summary.ire > CLASIFICACION_IRE.MEDIA) {
      recommendations.push('🔺 IRE alto. Considera fraccionar esta comida o aumentar actividad física.');
    } else if (summary.ire > CLASIFICACION_IRE.BAJA) {
      recommendations.push('📈 IRE moderado. Monitoriza tu respuesta glucémica.');
    }

    // Recomendaciones para VG
    if (summary.vg > CLASIFICACION_VG.MEDIA) {
      recommendations.push('⚡ Alto valor glucémico por caloría. Considera alimentos más ricos en proteína o grasa.');
    }

    return recommendations;
  }

  /**
   * Redondea un número a los decimales especificados
   */
  private static round(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}