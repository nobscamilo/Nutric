import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export const ProfileScreen = ({ userProfile, onSaveProfile }) => {
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
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Peso (kg)</label><input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Altura (cm)</label><input type="number" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none" /></div>
                </div>
                <div className="mb-4"><label className="text-[10px] font-bold text-slate-500 uppercase">Actividad Física</label><select value={formData.activity} onChange={e => setFormData({ ...formData, activity: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm"><option value="1.2">Sedentario</option><option value="1.375">Ligero (1-3 días)</option><option value="1.55">Moderado (3-5 días)</option><option value="1.725">Alto</option></select></div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Enfoque Clínico</span>
                        <Badge color={formData.isDiabetic ? 'blue' : 'green'}>{formData.isDiabetic ? 'Diabetes' : 'Lifestyle'}</Badge>
                    </div>
                    <button onClick={() => setFormData({ ...formData, isDiabetic: !formData.isDiabetic })} className="w-full text-left text-xs text-blue-500 font-bold hover:underline mb-4">
                        Cambiar a {formData.isDiabetic ? 'No Diabético' : 'Diabético'}
                    </button>

                    {formData.isDiabetic ? (
                        <div className="mt-2 animate-in fade-in">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Ratio Insulina (ICR)</label>
                            <input type="number" value={formData.icr} onChange={e => setFormData({ ...formData, icr: e.target.value })} className="w-full p-2 rounded-lg border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900" placeholder="15" />
                        </div>
                    ) : (
                        <div className="mt-2 animate-in fade-in space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Objetivo</label>
                                <div className="flex gap-2">
                                    {['lose', 'maintain', 'gain'].map(g => (
                                        <button key={g} onClick={() => setFormData({ ...formData, goal: g })} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${formData.goal === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
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
