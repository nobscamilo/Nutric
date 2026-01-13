import React from 'react';
import { Utensils } from 'lucide-react';

export const MealSummary = ({ meals, type, icon: Icon, targetCals }) => {
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
