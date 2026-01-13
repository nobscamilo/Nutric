import React from 'react';

export const Badge = ({ children, color = "blue", className = "" }) => {
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
