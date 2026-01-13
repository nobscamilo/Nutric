import React from 'react';

export const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 ${className}`}>
        {children}
    </div>
);
