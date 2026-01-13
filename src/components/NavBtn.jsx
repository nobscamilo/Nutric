import React from 'react';

export const NavBtn = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);
