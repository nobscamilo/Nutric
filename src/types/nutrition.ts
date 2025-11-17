// Types for the Glycemic Calculator Application

export interface FoodItem {
  name: string;
  gi: number; // Glycemic Index
  carbs: number; // Carbohydrates per 100g
  kcal: number; // Calories per 100g
  density?: number; // Density for liquids (g/ml)
}

export interface FoodItemWithImage extends FoodItem {
  image?: string;
  imageSmall?: string;
  source: 'local' | 'openfoodfacts';
  barcode?: string;
  brand?: string;
  nutriscore?: string;
  categories?: string[];
}

export interface FoodEntry {
  name: string;
  quantity: number; // grams or ml
  gi: number;
  carbs_g: number; // calculated carbs for the quantity
  cg: number; // calculated glycemic load
  kcal: number; // calculated calories for the quantity
}

export interface UserProfile {
  nombre: string;
  sexo: 'M' | 'F';
  edad: number;
  peso: number; // weight in kg
  talla: number; // height in cm
}

export interface NutritionalSummary {
  totalCG: number; // Total Glycemic Load
  totalKcal: number; // Total Calories
  totalCarbs: number; // Total Carbohydrates
  weightedGI: number; // Weighted Glycemic Index
  ire: number; // Estimated Response Index (CG / kg)
  vg: number; // Glycemic Value (CG / Kcal × 100)
}

export interface Recipe {
  id: string;
  name: string;
  items: RecipeItem[];
  created: string; // ISO date string
}

export interface RecipeItem {
  name: string;
  qty: number;
}

export interface SearchResult {
  results: FoodItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
}

export type MealType = 'Desayuno' | 'Merienda' | 'Comida' | 'Cena';

export interface ExportData {
  profile?: UserProfile;
  mealType: MealType;
  foods: FoodEntry[];
  summary: NutritionalSummary;
  date: string;
}

export interface ProgressBarData {
  value: number;
  max: number;
  percentage: number;
  level: 'low' | 'medium' | 'high';
  color: string;
}

// Legacy types for compatibility (mantener los nombres anteriores)
export interface Alimento extends FoodItem {}
export interface AlimentoEnComida extends FoodEntry {}
export interface PerfilUsuario extends UserProfile {}
export interface ResumenNutricional extends NutritionalSummary {}
export interface Receta extends Recipe {}
export type TipoComida = MealType;

// Database-related types
export interface DBStores {
  alimentos: 'alimentos';
  recipes: 'recipes';
  ean: 'ean';
}

export interface EANMapping {
  code: string;
  foodName: string;
  brand?: string;
  created: string;
}

// Component props types
export interface FoodTableProps {
  foods: FoodEntry[];
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemoveFood: (name: string) => void;
}

export interface FoodCardsProps {
  foods: FoodEntry[];
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemoveFood: (name: string) => void;
}

export interface NutritionalSummaryProps {
  summary: NutritionalSummary;
  profile?: UserProfile;
}

export interface ProfilePanelProps {
  profile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onLoadProfile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem) => void;
  foods: FoodItem[];
}

export interface BarcodeScannerProps {
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onScanResult: (result: ScanResult) => void;
}

export interface RecipeManagerProps {
  recipes: Recipe[];
  currentFoods: FoodEntry[];
  onSaveRecipe: (name: string, items: RecipeItem[]) => void;
  onLoadRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export interface ExportControlsProps {
  foods: FoodEntry[];
  summary: NutritionalSummary;
  profile?: UserProfile;
  mealType: MealType;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

// Hook return types
export interface UseFoodDatabaseReturn {
  foods: FoodItem[];
  isLoading: boolean;
  error: string | null;
  searchFoods: (query: string) => FoodItem[];
  addCustomFood: (food: FoodItem) => Promise<void>;
  getFoodByName: (name: string) => Promise<FoodItem | null>;
  initializeDatabase: () => Promise<void>;
}

export interface UseNutritionalCalculationsReturn {
  summary: NutritionalSummary;
  calculateFoodEntry: (food: FoodItem, quantity: number) => FoodEntry;
  calculateSummary: (foods: FoodEntry[], profile?: UserProfile) => NutritionalSummary;
  getProgressBarData: (value: number, type: 'cg' | 'ire' | 'vg') => ProgressBarData;
}

export interface UseProfileReturn {
  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => void;
  loadProfile: () => UserProfile | null;
  clearProfile: () => void;
  hasProfile: boolean;
}

export interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  clearValue: () => void;
}

export interface UseBarcodeScannerReturn {
  isScanning: boolean;
  isSupported: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  lastResult: ScanResult | null;
}

// Tipos para el sistema Trie de búsqueda
export interface TrieNode {
  children: { [key: string]: TrieNode };
  words: FoodItem[];
  end: boolean;
}

// Tipos para barras de progreso
export interface BarraConfig {
  valor: number;
  porcentaje: number;
  clase: 'low' | 'medium' | 'high';
  limite_bajo: number;
  limite_alto: number;
}

export interface CodigoEAN {
  code: string;
  name: string;
  gi?: number;
  carbs?: number;
  kcal?: number;
  density?: number;
}

export interface ConfiguracionApp {
  tipoComida: TipoComida;
  perfilCollapsed: boolean;
}

// Constantes de clasificación
export const CLASIFICACION_CG = {
  BAJA: 10,
  MEDIA: 20
} as const;

export const CLASIFICACION_IRE = {
  BAJA: 0.7,
  MEDIA: 1.2
} as const;

export const CLASIFICACION_VG = {
  BAJA: 10,
  MEDIA: 25
} as const;