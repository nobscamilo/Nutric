import { Alimento, Receta, CodigoEAN } from '@/types/nutrition';
import { seedAlimentos } from './foodData';

const DB_NAME = 'glucemica_web_v2';
const DB_VERSION = 1;

export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private static instance: IndexedDBService;

  static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available on server'));
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Store para alimentos
          if (!db.objectStoreNames.contains('alimentos')) {
            db.createObjectStore('alimentos', { keyPath: 'name' });
          }
          
          // Store para recetas
          if (!db.objectStoreNames.contains('recipes')) {
            db.createObjectStore('recipes', { keyPath: 'id' });
          }
          
          // Store para códigos EAN
          if (!db.objectStoreNames.contains('ean')) {
            db.createObjectStore('ean', { keyPath: 'code' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = () => {
          reject(new Error('Error al abrir IndexedDB'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        } catch (error) {
          reject(error);
        }
      });
    } catch {
      return null;
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        } catch (error) {
          reject(error);
        }
      });
    } catch {
      return [];
    }
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Métodos específicos para alimentos
  async saveAlimento(alimento: Alimento): Promise<void> {
    await this.put('alimentos', alimento);
  }

  async getAlimento(name: string): Promise<Alimento | null> {
    return this.get<Alimento>('alimentos', name);
  }

  async getAllAlimentos(): Promise<Alimento[]> {
    return this.getAll<Alimento>('alimentos');
  }

  async deleteAlimento(name: string): Promise<void> {
    await this.delete('alimentos', name);
  }

  // Métodos específicos para recetas
  async saveReceta(receta: Receta): Promise<void> {
    await this.put('recipes', receta);
  }

  async getReceta(id: string): Promise<Receta | null> {
    return this.get<Receta>('recipes', id);
  }

  async getAllRecetas(): Promise<Receta[]> {
    return this.getAll<Receta>('recipes');
  }

  async deleteReceta(id: string): Promise<void> {
    await this.delete('recipes', id);
  }

  // Métodos específicos para códigos EAN
  async saveCodigoEAN(codigo: CodigoEAN): Promise<void> {
    await this.put('ean', codigo);
  }

  async getCodigoEAN(code: string): Promise<CodigoEAN | null> {
    return this.get<CodigoEAN>('ean', code);
  }

  async getAllCodigosEAN(): Promise<CodigoEAN[]> {
    return this.getAll<CodigoEAN>('ean');
  }

  // Inicializar con datos semilla
  async initializeWithSeedData(): Promise<void> {
    try {
      const existingAlimentos = await this.getAllAlimentos();
      
      if (existingAlimentos.length === 0) {
        console.log('Inicializando base de datos con alimentos...');
        
        for (const alimento of seedAlimentos) {
          await this.saveAlimento(alimento);
        }
        
        console.log(`✓ ${seedAlimentos.length} alimentos cargados en IndexedDB`);
      } else {
        console.log(`✓ Base de datos ya inicializada con ${existingAlimentos.length} alimentos`);
      }
    } catch (error) {
      console.error('Error al inicializar datos semilla:', error);
      throw error;
    }
  }

  // Verificar si la base de datos está disponible
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

// Instancia singleton
export const dbService = IndexedDBService.getInstance();