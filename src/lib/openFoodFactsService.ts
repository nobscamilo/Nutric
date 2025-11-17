// OpenFoodFacts API Service for food data integration with image support
import { FoodItem } from '@/types/nutrition';

export interface FoodItemWithImage extends FoodItem {
  image?: string;
  imageSmall?: string;
  source: 'local' | 'openfoodfacts';
  barcode?: string;
  brand?: string;
  nutriscore?: string;
  categories?: string[];
}

interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_es?: string;
    product_name_en?: string;
    brands?: string;
    categories?: string;
    categories_tags?: string[];
    nutriments?: {
      'energy-kcal_100g'?: number;
      'carbohydrates_100g'?: number;
      'sugars_100g'?: number;
      'proteins_100g'?: number;
      'fat_100g'?: number;
      'fiber_100g'?: number;
      'sodium_100g'?: number;
    };
    nutrition_grades?: string;
    image_front_url?: string;
    image_front_small_url?: string;
    image_url?: string;
    image_small_url?: string;
    image_thumb_url?: string;
  };
  status: number;
  status_verbose: string;
}

interface SearchProductItem {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  nutriments?: {
    'energy-kcal_100g'?: number;
    'carbohydrates_100g'?: number;
    'sugars_100g'?: number;
    'proteins_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sodium_100g'?: number;
  };
  nutrition_grades?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_url?: string;
  image_small_url?: string;
  image_thumb_url?: string;
}

interface OpenFoodFactsSearchResponse {
  products: SearchProductItem[];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
}

export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org';
  private static readonly API_URL = `${this.BASE_URL}/api/v2`;
  private static readonly SEARCH_URL = `${this.BASE_URL}/cgi/search.pl`;

  /**
   * Busca un producto por código de barras con imagen
   */
  static async getProductByBarcode(barcode: string): Promise<FoodItemWithImage | null> {
    try {
      const url = `${this.API_URL}/product/${barcode}.json`;
      
      console.log(`🔍 Buscando producto con código: ${barcode}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CalculadoraGlucemica/1.0.0 (contact@example.com)'
        }
      });

      if (!response.ok) {
        console.error(`Error HTTP ${response.status} al buscar producto`);
        return null;
      }

      const data: OpenFoodFactsProduct = await response.json();

      if (data.status !== 1 || !data.product) {
        console.warn(`Producto no encontrado para código: ${barcode}`);
        return null;
      }

      return this.convertToFoodItemWithImage(data.product, barcode);

    } catch (error) {
      console.error('Error al buscar producto por código:', error);
      return null;
    }
  }

  /**
   * Busca productos por texto con imágenes
   */
  static async searchProducts(query: string, page = 1, pageSize = 20): Promise<{
    products: FoodItemWithImage[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: 'unique_scans_n',
        countries: 'spain,mexico,argentina,colombia',
        fields: 'code,product_name,product_name_es,brands,categories,categories_tags,nutriments,nutrition_grades,image_front_url,image_front_small_url,image_url,image_small_url,image_thumb_url'
      });

      const url = `${this.SEARCH_URL}?${params.toString()}`;
      
      console.log(`🔍 Buscando productos: "${query}" (página ${page})`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CalculadoraGlucemica/1.0.0 (contact@example.com)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OpenFoodFactsSearchResponse = await response.json();

      const products = data.products
        .filter(product => product && (product.product_name || product.product_name_es))
        .map(product => this.convertSearchItemToFoodItem(product))
        .filter((item): item is FoodItemWithImage => item !== null)
        .slice(0, pageSize); // Ensure we don't exceed pageSize

      return {
        products,
        totalCount: data.count || 0,
        hasMore: page < (data.page_count || 1)
      };

    } catch (error) {
      console.error('Error al buscar productos:', error);
      return {
        products: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  /**
   * Convierte un producto de OpenFoodFacts a nuestro formato con imagen
   */
  private static convertToFoodItemWithImage(
    product: OpenFoodFactsProduct['product'], 
    barcode?: string
  ): FoodItemWithImage | null {
    try {
      // Obtener nombre del producto con fallbacks
      const name = this.getProductName(product);
      if (!name) {
        console.warn('Producto sin nombre válido');
        return null;
      }

      // Obtener datos nutricionales
      const nutriments = product.nutriments || {};
      
      // Kilocalorías por 100g
      const kcal = nutriments['energy-kcal_100g'] || 0;
      
      // Carbohidratos por 100g
      const carbs = nutriments['carbohydrates_100g'] || 0;

      // Estimar índice glucémico basado en información disponible
      const gi = this.estimateGlycemicIndex(product, carbs);

      // Detectar si es líquido
      const density = this.detectDensity(product);

      // Crear nombre completo con marca si está disponible
      const fullName = this.createFullName(name, product.brands);

      // Obtener imágenes disponibles
      const images = this.extractImages(product);

      const foodItem: FoodItemWithImage = {
        name: fullName,
        gi,
        carbs: Math.round(carbs * 10) / 10,
        kcal: Math.round(kcal),
        ...(density && { density }),
        source: 'openfoodfacts',
        ...(barcode && { barcode }),
        ...(product.brands && { brand: product.brands.split(',')[0].trim() }),
        ...(product.nutrition_grades && { nutriscore: product.nutrition_grades.toUpperCase() }),
        ...(images.main && { image: images.main }),
        ...(images.small && { imageSmall: images.small }),
        categories: this.extractCategories(product)
      };

      console.log(`✅ Producto convertido: ${fullName} (IG: ${gi}, Carbs: ${carbs}g, Kcal: ${kcal})${barcode ? ` [${barcode}]` : ''}`);
      
      return foodItem;

    } catch (error) {
      console.error('Error al convertir producto:', error);
      return null;
    }
  }

  /**
   * Convierte un item de búsqueda a FoodItemWithImage
   */
  private static convertSearchItemToFoodItem(item: SearchProductItem): FoodItemWithImage | null {
    try {
      // Obtener nombre del producto con fallbacks
      const name = this.getProductNameFromItem(item);
      if (!name) {
        console.warn('Producto sin nombre válido en búsqueda');
        return null;
      }

      // Obtener datos nutricionales
      const nutriments = item.nutriments || {};
      
      // Kilocalorías por 100g
      const kcal = nutriments['energy-kcal_100g'] || 0;
      
      // Carbohidratos por 100g
      const carbs = nutriments['carbohydrates_100g'] || 0;

      // Estimar índice glucémico
      const gi = this.estimateGlycemicIndexFromItem(item, carbs);

      // Detectar si es líquido
      const density = this.detectDensityFromItem(item);

      // Crear nombre completo con marca
      const fullName = this.createFullName(name, item.brands);

      // Obtener imágenes disponibles
      const images = this.extractImagesFromItem(item);

      const foodItem: FoodItemWithImage = {
        name: fullName,
        gi,
        carbs: Math.round(carbs * 10) / 10,
        kcal: Math.round(kcal),
        ...(density && { density }),
        source: 'openfoodfacts',
        ...(item.code && { barcode: item.code }),
        ...(item.brands && { brand: item.brands.split(',')[0].trim() }),
        ...(item.nutrition_grades && { nutriscore: item.nutrition_grades.toUpperCase() }),
        ...(images.main && { image: images.main }),
        ...(images.small && { imageSmall: images.small }),
        categories: this.extractCategoriesFromItem(item)
      };

      console.log(`✅ Producto de búsqueda convertido: ${fullName} (IG: ${gi}, Carbs: ${carbs}g, Kcal: ${kcal})`);
      
      return foodItem;

    } catch (error) {
      console.error('Error al convertir producto de búsqueda:', error);
      return null;
    }
  }

  /**
   * Extrae imágenes del producto
   */
  private static extractImages(product: OpenFoodFactsProduct['product']): { main?: string; small?: string } {
    const main = product.image_front_url || product.image_url;
    const small = product.image_front_small_url || product.image_small_url || product.image_thumb_url;
    
    return { main, small };
  }

  /**
   * Extrae imágenes de un item de búsqueda
   */
  private static extractImagesFromItem(item: SearchProductItem): { main?: string; small?: string } {
    const main = item.image_front_url || item.image_url;
    const small = item.image_front_small_url || item.image_small_url || item.image_thumb_url;
    
    return { main, small };
  }

  /**
   * Extrae categorías del producto
   */
  private static extractCategories(product: OpenFoodFactsProduct['product']): string[] {
    if (product.categories_tags) {
      return product.categories_tags
        .map(tag => tag.replace(/^en:/, '').replace(/-/g, ' '))
        .slice(0, 5);
    }
    
    if (product.categories) {
      return product.categories
        .split(',')
        .map(cat => cat.trim())
        .slice(0, 5);
    }

    return [];
  }

  /**
   * Extrae categorías de un item de búsqueda
   */
  private static extractCategoriesFromItem(item: SearchProductItem): string[] {
    if (item.categories_tags) {
      return item.categories_tags
        .map(tag => tag.replace(/^en:/, '').replace(/-/g, ' '))
        .slice(0, 5);
    }
    
    if (item.categories) {
      return item.categories
        .split(',')
        .map(cat => cat.trim())
        .slice(0, 5);
    }

    return [];
  }

  /**
   * Obtiene el nombre del producto de un item de búsqueda
   */
  private static getProductNameFromItem(item: SearchProductItem): string {
    return (
      item.product_name_es ||
      item.product_name ||
      item.product_name_en ||
      ''
    ).trim();
  }

  /**
   * Obtiene el nombre del producto con fallbacks
   */
  private static getProductName(product: OpenFoodFactsProduct['product']): string {
    return (
      product.product_name_es ||
      product.product_name ||
      product.product_name_en ||
      ''
    ).trim();
  }

  /**
   * Crea el nombre completo con marca
   */
  private static createFullName(name: string, brands?: string): string {
    if (!brands) return name;
    
    const brand = brands.split(',')[0].trim();
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return name;
    }
    
    return `${name} (${brand})`;
  }

  /**
   * Estima el índice glucémico basado en la información disponible
   */
  private static estimateGlycemicIndex(
    product: OpenFoodFactsProduct['product'], 
    carbs: number
  ): number {
    // Si no tiene carbohidratos, IG = 0
    if (carbs < 1) return 0;

    const categories = (product.categories || '').toLowerCase();
    const name = this.getProductName(product).toLowerCase();
    const nutriments = product.nutriments || {};
    
    return this.calculateGIFromData(categories, name, nutriments, carbs);
  }

  /**
   * Estima IG para items de búsqueda
   */
  private static estimateGlycemicIndexFromItem(item: SearchProductItem, carbs: number): number {
    // Si no tiene carbohidratos, IG = 0
    if (carbs < 1) return 0;

    const categories = (item.categories || '').toLowerCase();
    const name = this.getProductNameFromItem(item).toLowerCase();
    const nutriments = item.nutriments || {};
    
    // Usar la lógica existente
    return this.calculateGIFromData(categories, name, nutriments, carbs);
  }

  /**
   * Detecta densidad para items de búsqueda
   */
  private static detectDensityFromItem(item: SearchProductItem): number | undefined {
    const categories = (item.categories || '').toLowerCase();
    const name = this.getProductNameFromItem(item).toLowerCase();
    
    return this.calculateDensityFromData(categories, name);
  }

  /**
   * Calcula IG basado en datos nutricionales
   */
  private static calculateGIFromData(
    categories: string, 
    name: string, 
    nutriments: any, 
    carbs: number
  ): number {
    // Obtener azúcares y fibra para estimación más precisa
    const sugars = nutriments['sugars_100g'] || 0;
    const fiber = nutriments['fiber_100g'] || 0;

    // Estimación basada en categorías y composición
    if (categories.includes('beverages') || categories.includes('bebidas')) {
      if (sugars > 8) return 65; // Bebidas azucaradas
      if (categories.includes('fruit') || categories.includes('fruta')) return 45;
      return 25; // Bebidas sin azúcar
    }

    if (categories.includes('fruits') || categories.includes('frutas') || name.includes('fruta')) {
      if (sugars > 15) return 55; // Frutas muy dulces
      return 40; // Frutas normales
    }

    if (categories.includes('vegetables') || categories.includes('verduras') || name.includes('verdura')) {
      return 15; // Verduras generalmente bajo IG
    }

    if (categories.includes('dairy') || categories.includes('lácteos') || name.includes('leche')) {
      if (sugars > 8) return 45; // Lácteos azucarados
      return 30; // Lácteos naturales
    }

    if (categories.includes('cereals') || categories.includes('cereales') || 
        categories.includes('bread') || categories.includes('pan')) {
      if (fiber > 5) return 50; // Cereales integrales
      if (sugars > 10) return 75; // Cereales azucarados
      return 65; // Cereales refinados
    }

    if (categories.includes('legumes') || categories.includes('legumbres')) {
      return 30; // Legumbres bajo IG
    }

    if (categories.includes('nuts') || categories.includes('frutos secos')) {
      return 15; // Frutos secos bajo IG
    }

    if (categories.includes('snacks') || categories.includes('aperitivos')) {
      return 70; // Snacks generalmente alto IG
    }

    if (categories.includes('sweets') || categories.includes('dulces') || 
        categories.includes('chocolate') || sugars > 20) {
      return 70; // Dulces alto IG
    }

    // Estimación por ratio azúcar/fibra
    if (fiber > 0) {
      const sugarFiberRatio = sugars / fiber;
      if (sugarFiberRatio < 2) return 40; // Alto contenido de fibra
      if (sugarFiberRatio > 10) return 65; // Alto contenido de azúcar
    }

    // Estimación por contenido de azúcares
    const sugarPercentage = (sugars / carbs) * 100;
    if (sugarPercentage > 80) return 70; // Muy alto en azúcares
    if (sugarPercentage > 50) return 60; // Alto en azúcares
    if (sugarPercentage < 20) return 45; // Bajo en azúcares

    // Valor por defecto para alimentos procesados
    return 55;
  }

  /**
   * Calcula densidad basado en categorías y nombre
   */
  private static calculateDensityFromData(categories: string, name: string): number | undefined {
    // Bebidas
    if (categories.includes('beverages') || categories.includes('bebidas') || 
        name.includes('zumo') || name.includes('jugo') || 
        name.includes('refresco') || name.includes('agua') ||
        name.includes('leche') || name.includes('batido')) {
      
      // Densidades específicas por tipo de bebida
      if (name.includes('leche')) return 1.03;
      if (categories.includes('fruit-juices') || name.includes('zumo')) return 1.04;
      if (categories.includes('sodas') || name.includes('refresco')) return 1.04;
      if (name.includes('agua')) return 1.0;
      
      return 1.02; // Densidad promedio para líquidos
    }

    // Otros líquidos
    if (categories.includes('oils') || name.includes('aceite')) return 0.91;
    if (categories.includes('honey') || name.includes('miel')) return 1.4;
    if (categories.includes('syrups') || name.includes('sirope')) return 1.3;

    return undefined; // No es líquido
  }

  /**
   * Detecta si el producto es líquido y calcula densidad
   */
  private static detectDensity(product: OpenFoodFactsProduct['product']): number | undefined {
    const categories = (product.categories || '').toLowerCase();
    const name = this.getProductName(product).toLowerCase();
    
    return this.calculateDensityFromData(categories, name);
  }

  /**
   * Valida si un código de barras es válido
   */
  static isValidBarcode(barcode: string): boolean {
    // Limpiar el código de barras
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    // Verificar longitud (códigos EAN-8, EAN-13, UPC-A, etc.)
    const validLengths = [8, 12, 13, 14];
    
    return validLengths.includes(cleanBarcode.length) && cleanBarcode.length > 0;
  }

  /**
   * Busca productos por múltiples criterios con imágenes
   */
  static async searchByCriteria(criteria: {
    name?: string;
    brand?: string;
    category?: string;
    barcode?: string;
  }): Promise<FoodItemWithImage[]> {
    try {
      let searchTerms: string[] = [];

      if (criteria.name) searchTerms.push(criteria.name);
      if (criteria.brand) searchTerms.push(criteria.brand);
      if (criteria.category) searchTerms.push(criteria.category);

      const query = searchTerms.join(' ');
      
      if (criteria.barcode) {
        const product = await this.getProductByBarcode(criteria.barcode);
        return product ? [product] : [];
      }

      if (query) {
        const { products } = await this.searchProducts(query);
        return products;
      }

      return [];

    } catch (error) {
      console.error('Error en búsqueda por criterios:', error);
      return [];
    }
  }

  /**
   * Obtiene sugerencias de productos basadas en texto parcial
   */
  static async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const { products } = await this.searchProducts(query.trim(), 1, 10);
      return products
        .map(product => product.name)
        .filter((name, index, array) => array.indexOf(name) === index) // Eliminar duplicados
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting suggestions from OpenFoodFacts:', error);
      return [];
    }
  }
}