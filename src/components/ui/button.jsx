import React from 'react'

export function Button({ className = '', variant = 'default', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none h-9 px-4 py-2'
  const variants = {
    default: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    outline: 'border border-slate-700 text-slate-100 hover:bg-slate-800',
    ghost: 'hover:bg-slate-800',
  }
  const cls = [base, variants[variant] || variants.default, className].join(' ')
  return <button className={cls} {...props} />
}

