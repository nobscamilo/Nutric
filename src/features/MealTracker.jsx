import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Loader2,
    Camera,
    Utensils,
    Trash2,
    AlertTriangle,
    ChefHat
} from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { MealSummary } from './MealSummary';
import { Dashboard } from './Dashboard';
import { YOUR_CUSTOM_DB, searchOpenFoodFacts, fetchByBarcode } from '../data';

export const MealTracker = ({ userProfile, onSaveMeal, todayMeals }) => {
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
        if (product) { setSelectedFood(product); setSearchTerm(''); }
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
                {[{ id: 'breakfast', label: 'Desayuno' }, { id: 'lunch', label: 'Comida' }, { id: 'snack', label: 'Merienda' }, { id: 'dinner', label: 'Cena' }]
                    .map(t => (
                        <button key={t.id} onClick={() => setMealType(t.id)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${mealType === t.id ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                            {t.label}
                        </button>
                    ))}
            </div>

            <Card className="relative overflow-visible z-20">
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar alimento..." className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"><Loader2 className="animate-spin" size={18} /></div>}
                    </div>
                    <button onClick={() => setIsScanning(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700"><Camera size={20} /></button>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute top-[80px] left-0 right-0 mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 z-30">
                        {searchResults.map(food => (
                            <button key={food.id} onClick={() => { setSelectedFood(food); setSearchTerm(''); setSearchResults([]); }} className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group flex items-center gap-3">
                                {food.image ? <img src={food.image} className="w-10 h-10 rounded bg-slate-200 object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400"><Utensils size={16} /></div>}
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
                            <button onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                        {selectedFood.source === 'OFF' && userProfile.isDiabetic && (
                            <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-[10px] text-amber-700 dark:text-amber-400 flex gap-2 items-start">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
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
                                        <input type="number" value={manualGi} onChange={e => setManualGi(e.target.value)} className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-700/50 dark:bg-slate-800 outline-none focus:border-amber-500" placeholder="Ej: 50" />
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
                                <button onClick={() => setCart(cart.filter(c => c.tempId !== item.tempId))} className="text-slate-300"><Trash2 size={14} /></button>
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
