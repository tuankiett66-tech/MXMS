
import React from 'react';

// Fix: Made children optional and added key to prop types to resolve "Property 'children' is missing" and "Property 'key' does not exist" errors in JSX
export const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string, key?: any }) => (
  <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

// Fix: Made children optional and added key to prop types to resolve "Property 'children' is missing" and "Property 'key' does not exist" errors in JSX
export const Badge = ({ children, color = "emerald" }: { children?: React.ReactNode, color?: string, key?: any }) => {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-600 text-white",
    slate: "bg-slate-100 text-slate-400",
    blue: "bg-blue-100 text-blue-600 border border-blue-200",
    pink: "bg-pink-100 text-pink-600 border border-pink-200",
    purple: "bg-purple-100 text-purple-600 border border-purple-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-100"
  };
  return (
    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${colors[color] || colors.emerald}`}>
      {children}
    </span>
  );
};
