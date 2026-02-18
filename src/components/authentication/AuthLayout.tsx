interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative h-screen overflow-x-hidden overflow-y-auto scrollbar-none bg-gradient-to-br from-slate-50 via-slate-100/80 to-indigo-50/40 px-4 py-12 font-['Plus_Jakarta_Sans'] dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-indigo-400/[0.06] blur-3xl dark:bg-indigo-500/[0.06]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 size-80 rounded-full bg-violet-400/[0.05] blur-3xl dark:bg-violet-500/[0.05]" />

      <div className="relative mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/25">
            M
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-center text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-xl shadow-slate-900/[0.06] backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-800/60 dark:shadow-black/30">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
          Marketing Board — Team Activity Management
        </p>
      </div>
    </div>
  )
}
