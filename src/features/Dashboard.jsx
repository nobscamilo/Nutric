import React from 'react';
import { Activity, Flame, Dumbbell, Scale } from 'lucide-react';
import { Card } from '../components/Card';

export const Dashboard = ({ todayMeals, userProfile }) => {
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
                    <div className="flex items-center gap-1.5"><Flame size={14} className="text-orange-400" /><span>Energía</span></div>
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
                        <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Activity size={12} /> Carga Glucémica</div>
                        <div className={`text-2xl font-black ${totals.gl > 100 ? 'text-red-400' : 'text-white'}`}>{Math.round(totals.gl)}</div>
                    </div>
                ) : (
                    <div className="bg-slate-800 p-4 rounded-xl relative overflow-hidden">
                        <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Dumbbell size={12} /> Proteína</div>
                        <div className="text-2xl font-black text-white z-10 relative">{Math.round(totals.protein)}<span className="text-sm text-slate-500">/{proteinTarget}g</span></div>
                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${percentProtein}%` }}></div>
                    </div>
                )}

                <div className="bg-slate-800 p-4 rounded-xl">
                    <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Scale size={12} /> Carbohidratos</div>
                    <div className="text-2xl font-black text-white">{Math.round(totals.carbs)}g</div>
                </div>
            </div>
        </Card>
    )
};
