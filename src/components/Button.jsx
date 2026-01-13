import React from 'react';

export const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, size = "md" }) => {
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
