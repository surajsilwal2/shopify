import Link from 'next/link'
import React from 'react'


interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    backLink?: {href: string, text: string, label: string}
}

const AuthLayout = ({children, title, subtitle, backLink}: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-[#080b14] flex items-center justify-center px-4 overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-150 w-150 rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-125 w-125 rounded-full bg-sky-500/5 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="inline-block rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 px-4 py-2 text-xl font-black tracking-tight text-black">
            SHOP
          </span>
          <span className="ml-2 text-xl font-light tracking-widest text-white/40 uppercase">
            store
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {backLink && (
          <p className="mt-5 text-center text-sm text-slate-600">
            {backLink.text}{" "}
            <Link
              href={backLink.href}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              {backLink.label}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthLayout