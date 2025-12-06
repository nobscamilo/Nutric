import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { 
  Activity, 
  Utensils, 
  Trash2, 
  Droplet,
  Search,
  Flame,
  User,
  Leaf,
  ScanBarcode,
  AlertTriangle,
  ChefHat,
  ArrowRight,
  Scale,
  Loader2,
  Camera,
  X,
  Dumbbell
} from 'lucide-react';

// --- 1. CONFIGURACIÓN FIREBASE ---

// CRÍTICO: Reemplaza este objeto con el que te da la consola de Firebase
// No uses JSON.parse(__firebase_config) en Vercel, no funcionará.
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TUS_NUMEROS",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Usamos un ID fijo o generado si no viene de Telegram para pruebas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nutric-twa-prod';

// --- 2. DATOS (Actualizado con Proteínas) ---
const YOUR_CUSTOM_DB = [
  { id: 'c1', name: "Arroz Blanco (Cocido)", carbs: 28, protein: 2.7, gi: 73, cals: 130, portion: 100, category: 'Cereal', source: 'CLINICAL' },
  { id: 'c2', name: "Arroz Integral", carbs: 23, protein: 2.6, gi: 68, cals: 111, portion: 100, category: 'Cereal', source: 'CLINICAL' },
  { id: 'f1', name: "Manzana (con piel)", carbs: 14, protein: 0.3, gi: 36, cals: 52, portion: 120, category: 'Fruta', source: 'CLINICAL' },
  { id: 'p1', name: "Pechuga de Pollo", carbs: 0, protein: 31, gi: 0, cals: 165, portion: 100, category: 'Proteína', source: 'CLINICAL' },
  { id: 'l1', name: "Huevo Cocido", carbs: 1.1, protein: 13, gi: 0, cals: 155, portion: 50, category: 'Proteína', source: 'CLINICAL' },
];

const searchOpenFoodFacts = async (term) => {
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

const fetchByBarcode = async (barcode) => {
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

// --- 3. UI COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue", className="" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    yellow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors[color] || colors.blue} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, size="md" }) => {
  const sizes = { sm: "py-2 px-3 text-xs", md: "py-3.5 px-4 text-sm" }
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-none",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`w-full rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 ${sizes[size]} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// --- 4. COMPONENTE CÁMARA ---
const BarcodeScanner = ({ onDetected, onClose }) => {
    const [error, setError] = useState(null);
    const [loadingLib, setLoadingLib] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        script.onload = () => { setLoadingLib(false); initScanner(); };
        script.onerror = () => setError("Error librería escaneo.");
        document.body.appendChild(script);
        return () => {
            if (scannerRef.current) try { scannerRef.current.stop().then(() => scannerRef.current.clear()); } catch(e){}
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

    const initScanner = () => {
        if (!window.Html5Qrcode) return;
        try {
            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };
            html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
                html5QrCode.stop().then(() => onDetected(decodedText));
            }, () => {}).catch(err => setError("Permiso de cámara denegado."));
        } catch (e) { setError("Error init."); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white font-bold flex items-center gap-2"><ScanBarcode /> Escáner EAN</span>
                <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 relative bg-black flex flex-col justify-center">
                {loadingLib ? <Loader2 className="animate-spin mx-auto text-blue-500" size={48} /> : 
                 error ? <p className="text-white text-center p-6">{error}</p> : 
                 <div id="reader" className="w-full h-full overflow-hidden"></div>}
            </div>
            <div className="bg-slate-900 p-6 rounded-t-2xl z-20 border-t border-slate-700">
                <div className="flex gap-2">
                    <input type="number" placeholder="Código manual..." value={manualCode} onChange={e => setManualCode(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none"/>
                    <button onClick={() => onDetected(manualCode)} disabled={!manualCode} className="bg-blue-600 text-white p-3 rounded-xl font-bold disabled:opacity-50"><ArrowRight /></button>
                </div>
            </div>
            <style>{`#reader video { object-fit: cover; width: 100% !important; height: 100% !important; } #reader__scan_region { display: none !important; }`}</style>
        </div>
    );
};

// --- 5. LOGICA DE NEGOCIO ---

const MealTracker = ({ userProfile, onSaveMeal, todayMeals }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [quantity, setQuantity] = useState('');
  const [manualGi, setManualGi] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsLoading(true);
        const localResults = YOUR_CUSTOM_DB.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const offResults = await searchOpenFoodFacts(searchTerm);
        setSearchResults([...localResults, ...offResults]);
        setIsLoading(false);
      } else { setSearchResults([]); setIsLoading(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleScanSuccess = async (code) => {
      setIsScanning(false); setIsLoading(true);
      const product = await fetchByBarcode(code);
      if(product) { setSelectedFood(product); setSearchTerm(''); } 
      else { setSearchTerm(`Error: ${code}`); }
      setIsLoading(false);
  };

  const addToCart = () => {
    if (!selectedFood || !quantity) return;
    if (selectedFood.source === 'OFF' && !manualGi && userProfile.isDiabetic) return; 

    const usedGi = selectedFood.source === 'CLINICAL' ? selectedFood.gi : parseFloat(manualGi) || 0;
    const factor = parseFloat(quantity) / 100; 
    
    const item = {
      ...selectedFood,
      realQuantity: parseFloat(quantity),
      realCarbs: (selectedFood.carbs * factor).toFixed(1),
      realProtein: (selectedFood.protein * factor).toFixed(1),
      realCals: (selectedFood.cals * factor).toFixed(0),
      realGL: ((usedGi * (selectedFood.carbs * factor)) / 100).toFixed(1),
      usedGi: usedGi,
      tempId: Date.now()
    };

    setCart([...cart, item]);
    setSelectedFood(null);
    setQuantity('');
    setManualGi('');
  };

  const cartTotals = useMemo(() => {
    return cart.reduce((acc, item) => ({
      carbs: acc.carbs + parseFloat(item.realCarbs),
      protein: acc.protein + parseFloat(item.realProtein),
      cals: acc.cals + parseFloat(item.realCals),
      gl: acc.gl + parseFloat(item.realGL)
    }), { carbs: 0, protein: 0, cals: 0, gl: 0 });
  }, [cart]);

  const suggestedInsulin = useMemo(() => {
    if (!userProfile?.isDiabetic || !userProfile?.icr || cartTotals.carbs === 0) return null;
    return (cartTotals.carbs / parseFloat(userProfile.icr)).toFixed(1);
  }, [cartTotals, userProfile]);

  const handleSaveLog = () => {
    onSaveMeal({
      type: 'meal',
      mealType,
      foods: cart,
      totals: cartTotals,
      insulinSuggested: suggestedInsulin,
      timestamp: serverTimestamp()
    });
    setCart([]);
  };

  return (
    <div className="space-y-6 pb-24">
      {isScanning && <BarcodeScanner onDetected={handleScanSuccess} onClose={() => setIsScanning(false)} />}

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar px-1">
        {[{id: 'breakfast', label: 'Desayuno'}, {id: 'lunch', label: 'Comida'}, {id: 'snack', label: 'Merienda'}, {id: 'dinner', label: 'Cena'}]
        .map(t => (
          <button key={t.id} onClick={() => setMealType(t.id)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${mealType === t.id ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="relative overflow-visible z-20">
        <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar alimento..." className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"><Loader2 className="animate-spin" size={18} /></div>}
            </div>
            <button onClick={() => setIsScanning(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700"><Camera size={20} /></button>
        </div>

        {searchResults.length > 0 && (
            <div className="absolute top-[80px] left-0 right-0 mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 z-30">
                {searchResults.map(food => (
                    <button key={food.id} onClick={() => { setSelectedFood(food); setSearchTerm(''); setSearchResults([]); }} className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group flex items-center gap-3">
                        {food.image ? <img src={food.image} className="w-10 h-10 rounded bg-slate-200 object-cover" alt=""/> : <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400"><Utensils size={16}/></div>}
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{food.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                                <span>{food.cals} kcal</span> • <span>Prot: {food.protein}g</span>
                                {food.source === 'CLINICAL' && <span className="text-emerald-500 font-bold ml-1">IG {food.gi}</span>}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {selectedFood && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50 animate-in fade-in">
                <div className="flex justify-between mb-3">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 leading-tight pr-4">{selectedFood.name}</h4>
                    <button onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
                {selectedFood.source === 'OFF' && userProfile.isDiabetic && (
                    <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-[10px] text-amber-700 dark:text-amber-400 flex gap-2 items-start">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                        <p><strong>Verifica el IG</strong> para cálculo de insulina.</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad (g)</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 outline-none focus:border-blue-500" placeholder="100" autoFocus />
                    </div>
                    {userProfile.isDiabetic ? (
                        selectedFood.source === 'OFF' ? (
                            <div>
                                <label className="text-[10px] font-bold text-amber-600 uppercase">IG (Requerido)</label>
                                <input type="number" value={manualGi} onChange={e => setManualGi(e.target.value)} className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-700/50 dark:bg-slate-800 outline-none focus:border-amber-500" placeholder="Ej: 50"/>
                            </div>
                        ) : (
                            <div><label className="text-[10px] font-bold text-emerald-600 uppercase">IG (Automático)</label><div className="p-2 font-bold text-emerald-700 bg-emerald-50 rounded-lg">{selectedFood.gi}</div></div>
                        )
                    ) : (
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase">Proteína</label><div className="p-2 font-bold text-slate-700 bg-slate-50 rounded-lg">{selectedFood.protein}g / 100g</div></div>
                    )}
                </div>
                <Button onClick={addToCart} disabled={!quantity || (userProfile.isDiabetic && selectedFood.source === 'OFF' && !manualGi)}>Añadir</Button>
            </div>
        )}

        {cart.length > 0 && (
            <div className="space-y-2 mb-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                 <h5 className="text-xs font-bold uppercase text-slate-400">Plato Actual:</h5>
                 {cart.map(item => (
                     <div key={item.tempId} className="flex justify-between items-center text-sm">
                         <span className="truncate w-1/2">{item.name}</span>
                         <div className="flex gap-2 text-xs font-bold">
                            <span className="text-slate-500">{Math.round(item.realCals)}kcal</span>
                            <span className="text-blue-500">{Math.round(item.realProtein)}g P</span>
                         </div>
                         <button onClick={() => setCart(cart.filter(c => c.tempId !== item.tempId))} className="text-slate-300"><Trash2 size={14}/></button>
                     </div>
                 ))}
                 <Button onClick={handleSaveLog} className="mt-4" variant="primary">
                    Guardar Comida
                 </Button>
            </div>
        )}
      </Card>

      {todayMeals.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <Dashboard todayMeals={todayMeals} userProfile={userProfile} />
             <h3 className="font-bold text-lg flex items-center gap-2 px-2 mt-6">
                 <ChefHat className="text-slate-400" />
                 Desglose
             </h3>
             <MealSummary meals={todayMeals.filter(m => m.mealType === 'breakfast')} type="breakfast" icon={Utensils} targetCals={userProfile.tdee ? userProfile.tdee / 4 : 500} />
             <MealSummary meals={todayMeals.filter(m => m.mealType === 'lunch')} type="lunch" icon={Utensils} targetCals={userProfile.tdee ? userProfile.tdee / 4 : 500} />
             <MealSummary meals={todayMeals.filter(m => m.mealType === 'snack')} type="snack" icon={Utensils} targetCals={userProfile.tdee ? userProfile.tdee / 4 : 500} />
             <MealSummary meals={todayMeals.filter(m => m.mealType === 'dinner')} type="dinner" icon={Utensils} targetCals={userProfile.tdee ? userProfile.tdee / 4 : 500} />
          </div>
      )}
    </div>
  );
};

// --- 6. PROFILE Y DASHBOARD (MODIFICADO PARA OBJETIVOS) ---

const ProfileScreen = ({ userProfile, onSaveProfile }) => {
    const [formData, setFormData] = useState(userProfile || {
      weight: '', height: '', age: '', gender: 'male', activity: '1.375', isDiabetic: false, icr: '15',
      goal: 'maintain', // lose, maintain, gain
    });

    const calculateMetrics = () => {
        const w = parseFloat(formData.weight) || 0;
        const h = parseFloat(formData.height) || 0;
        const a = parseFloat(formData.age) || 0;
        const s = formData.gender === 'male' ? 5 : -161;
        const bmr = (10 * w) + (6.25 * h) - (5 * a) + s;
        let tdee = bmr * parseFloat(formData.activity);
        
        // Ajuste por objetivo (Simplificado)
        if (formData.goal === 'lose') tdee -= 500;
        if (formData.goal === 'gain') tdee += 300;

        // Proteína Sugerida (g/kg)
        let proteinFactor = 1.0;
        if (formData.goal === 'lose') proteinFactor = 1.8; // Protección muscular
        if (formData.goal === 'gain') proteinFactor = 1.8; // Hipertrofia
        if (formData.goal === 'maintain') proteinFactor = 1.2;
        if (formData.isDiabetic) proteinFactor = 1.0; // Estándar en diabetes (cuidado renal)

        const proteinTarget = (w * proteinFactor).toFixed(0);

        return { tdee: tdee.toFixed(0), proteinTarget };
    };

    return (
        <div className="pb-24 space-y-6">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600"><User size={24} /></div>
                    <div><h3 className="font-bold text-lg">Datos Biométricos</h3></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Peso (kg)</label><input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Altura (cm)</label><input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none" /></div>
                </div>
                <div className="mb-4"><label className="text-[10px] font-bold text-slate-500 uppercase">Actividad Física</label><select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm"><option value="1.2">Sedentario</option><option value="1.375">Ligero (1-3 días)</option><option value="1.55">Moderado (3-5 días)</option><option value="1.725">Alto</option></select></div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Enfoque Clínico</span>
                        <Badge color={formData.isDiabetic ? 'blue' : 'green'}>{formData.isDiabetic ? 'Diabetes' : 'Lifestyle'}</Badge>
                    </div>
                    <button onClick={() => setFormData({...formData, isDiabetic: !formData.isDiabetic})} className="w-full text-left text-xs text-blue-500 font-bold hover:underline mb-4">
                        Cambiar a {formData.isDiabetic ? 'No Diabético' : 'Diabético'}
                    </button>

                    {formData.isDiabetic ? (
                        <div className="mt-2 animate-in fade-in">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Ratio Insulina (ICR)</label>
                            <input type="number" value={formData.icr} onChange={e => setFormData({...formData, icr: e.target.value})} className="w-full p-2 rounded-lg border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900" placeholder="15"/>
                        </div>
                    ) : (
                        <div className="mt-2 animate-in fade-in space-y-3">
                             <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Objetivo</label>
                                <div className="flex gap-2">
                                    {['lose', 'maintain', 'gain'].map(g => (
                                        <button key={g} onClick={() => setFormData({...formData, goal: g})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${formData.goal === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                                            {g === 'lose' ? 'Bajar' : g === 'maintain' ? 'Mantener' : 'Subir'}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <p className="text-[10px] text-slate-400">
                                {formData.goal === 'lose' ? 'Déficit de 500kcal + Alta Proteína' : formData.goal === 'gain' ? 'Superávit 300kcal + Alta Proteína' : 'Mantenimiento Normocalórico'}
                             </p>
                        </div>
                    )}
                </div>
                <Button onClick={() => onSaveProfile({ ...formData, ...calculateMetrics() })}>Guardar Perfil</Button>
            </Card>
        </div>
    )
};

const Dashboard = ({ todayMeals, userProfile }) => {
  const totals = todayMeals.reduce((acc, m) => ({
    cals: acc.cals + m.totals.cals,
    gl: acc.gl + m.totals.gl,
    carbs: acc.carbs + m.totals.carbs,
    protein: acc.protein + m.totals.protein
  }), { cals: 0, carbs: 0, gl: 0, protein: 0 });

  const tdee = userProfile?.tdee ? parseFloat(userProfile.tdee) : 2000;
  const proteinTarget = userProfile?.proteinTarget ? parseFloat(userProfile.proteinTarget) : 100;
  
  const percentCals = Math.min((totals.cals / tdee) * 100, 100);
  const percentProtein = Math.min((totals.protein / proteinTarget) * 100, 100);

  return (
    <Card className="bg-slate-900 text-white border-none shadow-xl">
        <div className="flex items-center gap-2 mb-6">
            <Activity className="text-emerald-400" />
            <h3 className="font-bold text-lg">
                {userProfile.isDiabetic ? 'Control Glucémico' : 'Balance Nutricional'}
            </h3>
        </div>

        {/* BARRA CALORÍAS (Para todos) */}
        <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-sm font-medium mb-2 text-slate-300">
                <div className="flex items-center gap-1.5"><Flame size={14} className="text-orange-400"/><span>Energía</span></div>
                <span>{Math.round(totals.cals)} / {tdee} kcal</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-1">
                <div className={`h-full transition-all duration-1000 ${percentCals > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`} style={{ width: `${percentCals}%` }} />
            </div>
            {userProfile.goal === 'lose' && <div className="text-right text-[10px] text-slate-400">Objetivo: Déficit calórico</div>}
        </div>

        {/* MÉTRICAS DIFERENCIADAS */}
        <div className="grid grid-cols-2 gap-4">
            {userProfile.isDiabetic ? (
                 <div className="bg-slate-800 p-4 rounded-xl">
                    <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Carga Glucémica</div>
                    <div className={`text-2xl font-black ${totals.gl > 100 ? 'text-red-400' : 'text-white'}`}>{Math.round(totals.gl)}</div>
                 </div>
            ) : (
                 <div className="bg-slate-800 p-4 rounded-xl relative overflow-hidden">
                    <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Dumbbell size={12}/> Proteína</div>
                    <div className="text-2xl font-black text-white z-10 relative">{Math.round(totals.protein)}<span className="text-sm text-slate-500">/{proteinTarget}g</span></div>
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${percentProtein}%` }}></div>
                 </div>
            )}
            
            <div className="bg-slate-800 p-4 rounded-xl">
                 <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Scale size={12}/> Carbohidratos</div>
                 <div className="text-2xl font-black text-white">{Math.round(totals.carbs)}g</div>
            </div>
        </div>
    </Card>
  )
};

const MealSummary = ({ meals, type, icon: Icon, targetCals }) => {
  const totals = meals.reduce((acc, m) => ({
    cals: acc.cals + m.totals.cals,
    protein: acc.protein + m.totals.protein
  }), { cals: 0, protein: 0 });

  if (meals.length === 0) return null;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300"><Icon size={14} /></div>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Comida' : type === 'snack' ? 'Merienda' : 'Cena'}</h4>
        <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-700 ml-2"></div>
        <span className="text-xs font-bold text-slate-500">Meta: ~{Math.round(targetCals)} kcal</span>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 space-y-2">
         {meals.map((meal) => (
             meal.foods.map((food, idx) => (
                 <div key={`${meal.id}-${idx}`} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="truncate pr-2 flex-1">{food.name}</span>
                    <div className="flex gap-3 whitespace-nowrap">
                        <span className="text-blue-500 font-bold">{Math.round(food.realProtein)}g P</span>
                        <span>{Math.round(food.realCals)} kcal</span>
                    </div>
                 </div>
             ))
         ))}
         <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400 uppercase">Total Ingerido</span>
            <div className={`px-2 py-0.5 rounded ${totals.cals > targetCals + 100 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {Math.round(totals.cals)} kcal
            </div>
         </div>
      </div>
    </div>
  );
};

// --- 7. APP ROOT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('food');
  const [todayMeals, setTodayMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    };
    init();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(!u) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (doc) => {
      if (doc.exists()) setUserProfile(doc.data());
      else setActiveTab('profile');
    });
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'meals'), orderBy('timestamp', 'desc'));
    const unsubMeals = onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const today = new Date().toDateString();
      setTodayMeals(meals.filter(m => m.timestamp?.toDate().toDateString() === today));
      setLoading(false);
    });
    return () => { unsubProfile(); unsubMeals(); };
  }, [user]);

  const saveProfile = async (data) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), data);
    setActiveTab('food');
  };
  const saveMeal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'meals'), data);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Activity className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h1 className="font-black text-lg flex items-center gap-2">
           <Droplet className="text-blue-600 fill-current" size={20}/>
           Nutric<span className="text-slate-400 font-light">TWA</span>
        </h1>
        {userProfile && (
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase text-slate-400">{userProfile.isDiabetic ? 'Modo Clínico' : 'Estilo de Vida'}</span>
            </div>
        )}
      </header>
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'profile' && <ProfileScreen userProfile={userProfile} onSaveProfile={saveProfile} />}
        {activeTab === 'food' && (userProfile ? <MealTracker userProfile={userProfile} onSaveMeal={saveMeal} todayMeals={todayMeals} /> : <div className="text-center p-8 text-slate-500">Configura tu perfil primero</div>)}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-8 flex justify-between items-center z-50 max-w-md mx-auto">
        <NavBtn active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={<Utensils size={22} />} label="Diario" />
        <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={22} />} label="Perfil" />
      </nav>
    </div>
  );
}

const NavBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
  </button>
);
