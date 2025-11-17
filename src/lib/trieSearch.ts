import { Alimento } from '@/types/nutrition';

export interface ITrieNode {
  children: { [key: string]: ITrieNode };
  words: Alimento[];
  end: boolean;
}

export class TrieNode implements ITrieNode {
  children: { [key: string]: TrieNode } = {};
  words: Alimento[] = [];
  end: boolean = false;

  constructor() {
    this.children = {};
    this.words = [];
    this.end = false;
  }
}

export class Trie {
  private root: ITrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserta una palabra y su payload en el Trie
   */
  insert(word: string, payload: Alimento): void {
    let node = this.root;
    const key = this.normalizeText(word);
    
    for (const char of key) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      
      // Limitar la cantidad de palabras por nodo para performance
      if (node.words.length < 200) {
        node.words.push(payload);
      }
    }
    node.end = true;
  }

  /**
   * Busca todas las palabras que comienzan con el prefijo dado
   */
  searchPrefix(prefix: string): Alimento[] {
    if (!prefix) return [];
    
    let node = this.root;
    const key = this.normalizeText(prefix);
    
    for (const char of key) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    
    return node.words || [];
  }

  /**
   * Busca coincidencias difusas (fuzzy search)
   * Permite hasta 1 carácter de diferencia
   */
  fuzzySearch(query: string, maxDistance: number = 1): Alimento[] {
    const normalizedQuery = this.normalizeText(query);
    const results = new Set<Alimento>();
    
    this.fuzzySearchHelper(this.root, normalizedQuery, 0, maxDistance, '', results);
    
    return Array.from(results);
  }

  private fuzzySearchHelper(
    node: ITrieNode,
    query: string,
    queryIndex: number,
    maxDistance: number,
    currentWord: string,
    results: Set<Alimento>
  ): void {
    // Si hemos procesado toda la consulta
    if (queryIndex >= query.length) {
      if (maxDistance >= 0) {
        node.words.forEach(word => results.add(word));
      }
      return;
    }

    const targetChar = query[queryIndex];

    // Coincidencia exacta
    if (node.children[targetChar]) {
      this.fuzzySearchHelper(
        node.children[targetChar],
        query,
        queryIndex + 1,
        maxDistance,
        currentWord + targetChar,
        results
      );
    }

    // Si todavía tenemos distancia disponible
    if (maxDistance > 0) {
      // Sustitución
      for (const [char, childNode] of Object.entries(node.children)) {
        if (char !== targetChar) {
          this.fuzzySearchHelper(
            childNode,
            query,
            queryIndex + 1,
            maxDistance - 1,
            currentWord + char,
            results
          );
        }
      }

      // Inserción (saltar carácter en la consulta)
      this.fuzzySearchHelper(
        node,
        query,
        queryIndex + 1,
        maxDistance - 1,
        currentWord,
        results
      );

      // Eliminación (saltar carácter en el trie)
      for (const [char, childNode] of Object.entries(node.children)) {
        this.fuzzySearchHelper(
          childNode,
          query,
          queryIndex,
          maxDistance - 1,
          currentWord + char,
          results
        );
      }
    }
  }

  /**
   * Búsqueda por palabras parciales
   * Busca coincidencias en cualquier parte del nombre
   */
  partialSearch(query: string): Alimento[] {
    const normalizedQuery = this.normalizeText(query);
    const results: Alimento[] = [];
    
    this.getAllWords(this.root, []).forEach(alimento => {
      const normalizedName = this.normalizeText(alimento.name);
      if (normalizedName.includes(normalizedQuery)) {
        results.push(alimento);
      }
    });
    
    return results;
  }

  /**
   * Obtiene todas las palabras del Trie
   */
  private getAllWords(node: ITrieNode, visited: Alimento[]): Alimento[] {
    const words = [...node.words];
    
    for (const childNode of Object.values(node.children)) {
      words.push(...this.getAllWords(childNode, visited));
    }
    
    // Eliminar duplicados usando Set
    const uniqueWords = new Map<string, Alimento>();
    words.forEach(word => {
      uniqueWords.set(word.name, word);
    });
    
    return Array.from(uniqueWords.values());
  }

  /**
   * Normaliza el texto para búsquedas insensibles a acentos y mayúsculas
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .trim();
  }

  /**
   * Búsqueda inteligente que combina múltiples estrategias
   */
  intelligentSearch(query: string, limit: number = 50): Alimento[] {
    if (!query || query.trim().length < 1) return [];

    const normalizedQuery = query.trim();
    const results = new Map<string, Alimento>();
    
    // 1. Búsqueda por prefijo (máxima prioridad)
    const prefixResults = this.searchPrefix(normalizedQuery);
    prefixResults.slice(0, limit).forEach(item => {
      results.set(item.name, item);
    });
    
    // 2. Búsqueda parcial si no hay suficientes resultados
    if (results.size < limit) {
      const partialResults = this.partialSearch(normalizedQuery);
      partialResults.slice(0, limit - results.size).forEach(item => {
        if (!results.has(item.name)) {
          results.set(item.name, item);
        }
      });
    }
    
    // 3. Búsqueda difusa si aún no hay suficientes resultados
    if (results.size < limit && normalizedQuery.length > 3) {
      const fuzzyResults = this.fuzzySearch(normalizedQuery, 1);
      fuzzyResults.slice(0, limit - results.size).forEach(item => {
        if (!results.has(item.name)) {
          results.set(item.name, item);
        }
      });
    }
    
    return Array.from(results.values()).slice(0, limit);
  }

  /**
   * Obtiene estadísticas del Trie
   */
  getStats(): { totalNodes: number; totalWords: number; maxDepth: number } {
    const stats = { totalNodes: 0, totalWords: 0, maxDepth: 0 };
    
    this.calculateStats(this.root, 0, stats);
    
    return stats;
  }

  private calculateStats(
    node: ITrieNode,
    depth: number,
    stats: { totalNodes: number; totalWords: number; maxDepth: number }
  ): void {
    stats.totalNodes++;
    stats.totalWords += node.words.length;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    for (const child of Object.values(node.children)) {
      this.calculateStats(child, depth + 1, stats);
    }
  }

  /**
   * Limpia el Trie
   */
  clear(): void {
    this.root = new TrieNode();
  }

  /**
   * Obtiene sugerencias basadas en popularidad y relevancia
   */
  getSuggestions(query: string, limit: number = 10): Alimento[] {
    const results = this.intelligentSearch(query, limit * 2);
    
    // Ordenar por relevancia (longitud del nombre vs query)
    return results
      .sort((a, b) => {
        const aRelevance = this.calculateRelevance(a.name, query);
        const bRelevance = this.calculateRelevance(b.name, query);
        return bRelevance - aRelevance;
      })
      .slice(0, limit);
  }

  private calculateRelevance(name: string, query: string): number {
    const normalizedName = this.normalizeText(name);
    const normalizedQuery = this.normalizeText(query);
    
    // Bonus si empieza con la consulta
    if (normalizedName.startsWith(normalizedQuery)) {
      return 100;
    }
    
    // Bonus si contiene la consulta
    if (normalizedName.includes(normalizedQuery)) {
      return 50;
    }
    
    // Penalizar por longitud
    return Math.max(0, 25 - Math.abs(name.length - query.length));
  }
}

// Instancia singleton para la aplicación
export const foodTrie = new Trie();