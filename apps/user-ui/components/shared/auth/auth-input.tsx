import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    icon: React.ReactNode
}

 const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
     return (
       <div className="group relative w-full">
         <label className="mb-1.5 block text-xs font-semibold tracking-widest text-slate-400 uppercase">
           {label}
         </label>
         <div className="relative">
           {icon && (
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
               {icon}
             </span>
           )}
           <input
             ref={ref}
             className={cn(
               "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600",
               "transition-all duration-200 outline-none",
               "focus:border-amber-400/60 focus:bg-white/8 focus:ring-2 focus:ring-amber-400/20",
               "hover:border-white/20",
               icon && "pl-10",
               error &&
                 "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
               className,
             )}
             {...props}
           />
         </div>
         {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
       </div>
     );
  },
); 


AuthInput.displayName = 'AuthInput' // displayName helps in developer console when you wrap a component in forwardRef((props, ref) => { ... }), you are technically passing an anonymous function (a function without a name) into forwardRef.
// If you open React Developer Tools in your browser, instead of seeing <AuthInput /> in your component tree, you would see:
// ForwardRef or _c

export default AuthInput