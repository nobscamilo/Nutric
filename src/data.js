export const YOUR_CUSTOM_DB = [
    { id: 'c1', name: "Arroz Blanco (Cocido)", carbs: 28, protein: 2.7, gi: 73, cals: 130, portion: 100, category: 'Cereal', source: 'CLINICAL' },
    { id: 'c2', name: "Arroz Integral", carbs: 23, protein: 2.6, gi: 68, cals: 111, portion: 100, category: 'Cereal', source: 'CLINICAL' },
    { id: 'f1', name: "Manzana (con piel)", carbs: 14, protein: 0.3, gi: 36, cals: 52, portion: 120, category: 'Fruta', source: 'CLINICAL' },
    { id: 'p1', name: "Pechuga de Pollo", carbs: 0, protein: 31, gi: 0, cals: 165, portion: 100, category: 'Proteína', source: 'CLINICAL' },
    { id: 'l1', name: "Huevo Cocido", carbs: 1.1, protein: 13, gi: 0, cals: 155, portion: 50, category: 'Proteína', source: 'CLINICAL' },
];

export const searchOpenFoodFacts = async (term) => {
    if (!term || term.length < 3) return [];
    try {
        const response = await fetch(
            `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,image_front_small_url,_id,code`
        );
        const data = await response.json();
        return data.products.map(p => ({
            id: p._id || p.code,
            name: p.product_name || "Producto desconocido",
            carbs: p.nutriments?.carbohydrates_100g || 0,
            protein: p.nutriments?.proteins_100g || 0,
            cals: p.nutriments?.['energy-kcal_100g'] || 0,
            image: p.image_front_small_url,
            gi: null,
            portion: 100,
            unit: 'g',
            category: 'Importado',
            source: 'OFF'
        }));
    } catch (e) { return []; }
};

export const fetchByBarcode = async (barcode) => {
    if (!barcode) return null;
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        if (data.status === 1) {
            const p = data.product;
            return {
                id: p._id || p.code,
                name: p.product_name || "Producto Escaneado",
                carbs: p.nutriments?.carbohydrates_100g || 0,
                protein: p.nutriments?.proteins_100g || 0,
                cals: p.nutriments?.['energy-kcal_100g'] || 0,
                image: p.image_front_small_url,
                gi: null,
                portion: 100,
                unit: 'g',
                category: 'Escaneado',
                source: 'OFF'
            };
        }
        return null;
    } catch (e) { return null; }
};
