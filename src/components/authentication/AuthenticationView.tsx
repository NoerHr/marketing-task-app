import { useState, useEffect } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import type {
  AuthenticationProps,
} from '@/types/authentication'
import { AuthLayout } from './AuthLayout'

/* ─── Main Switch ─── */

export function AuthenticationView({
  currentScreen,
  loginForm,
  inviteData,
  registerForm,
  forgotPasswordForm,
  resetPasswordForm,
  emailVerification,
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  onResendVerification,
  onNavigate,
}: AuthenticationProps) {
  switch (currentScreen) {
    case 'login':
      return <LoginScreen form={loginForm} onLogin={onLogin} onNavigate={onNavigate} />
    case 'register':
      return (
        <RegisterScreen
          form={registerForm}
          inviteData={inviteData}
          onRegister={onRegister}
          onNavigate={onNavigate}
        />
      )
    case 'forgot-password':
      return (
        <ForgotPasswordScreen
          form={forgotPasswordForm}
          onForgotPassword={onForgotPassword}
          onNavigate={onNavigate}
        />
      )
    case 'reset-password':
      return (
        <ResetPasswordScreen
          form={resetPasswordForm}
          onResetPassword={onResetPassword}
          onNavigate={onNavigate}
        />
      )
    case 'email-verification':
      return (
        <EmailVerificationScreen
          verification={emailVerification}
          onResendVerification={onResendVerification}
          onNavigate={onNavigate}
        />
      )
    case 'invite-expired':
      return <InviteExpiredScreen onNavigate={onNavigate} />
    default:
      return null
  }
}

/* ─── Shared Components ─── */

function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  disabled,
  error,
  rightElement,
}: {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (val: string) => void
  icon?: React.ElementType
  disabled?: boolean
  error?: string
  rightElement?: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 disabled:cursor-not-allowed disabled:text-slate-400 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-600 dark:disabled:text-slate-500 ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${error ? 'border-rose-300 dark:border-rose-700/50' : 'border-slate-200/50 dark:border-slate-700/40'}`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-indigo-600"
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-200/50 bg-white/50 px-4 py-3 text-sm font-bold text-slate-600 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/60"
    >
      {children}
    </button>
  )
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }
  const strength = getStrength(password)
  if (!password) return null

  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-rose-400', 'bg-amber-400', 'bg-indigo-400', 'bg-emerald-400']

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : 'bg-slate-200/60 dark:bg-slate-700/40'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        {labels[strength - 1] || 'Too short'}
      </p>
    </div>
  )
}

/* ─── Login Screen ─── */

function LoginScreen({
  form,
  onLogin,
  onNavigate,
}: {
  form: AuthenticationProps['loginForm']
  onLogin?: AuthenticationProps['onLogin']
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  const [email, setEmail] = useState(form.email)
  const [password, setPassword] = useState(form.password)
  const [rememberMe, setRememberMe] = useState(form.rememberMe)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthLayout title="Marketing Board" subtitle="Sign in to your account">
      <div className="space-y-5">
        {form.error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200/40 bg-rose-50/60 px-4 py-3 text-sm font-medium text-rose-500 dark:border-rose-800/30 dark:bg-rose-950/30">
            <AlertCircle className="size-4 shrink-0" />
            {form.error}
          </div>
        )}

        <InputField
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          icon={Mail}
        />

        <InputField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          icon={Lock}
          rightElement={
            <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 dark:border-slate-600"
            />
            Remember me
          </label>
          <button
            onClick={() => onNavigate?.('forgot-password')}
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Forgot password?
          </button>
        </div>

        <PrimaryButton onClick={() => onLogin?.(email, password, rememberMe)}>
          Sign In
        </PrimaryButton>

        <p className="text-center text-sm text-slate-400 dark:text-slate-500">
          Don't have an account?{' '}
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Ask your team leader for an invite.
          </span>
        </p>
      </div>
    </AuthLayout>
  )
}

/* ─── Register Screen ─── */

function RegisterScreen({
  form,
  inviteData,
  onRegister,
  onNavigate,
}: {
  form: AuthenticationProps['registerForm']
  inviteData: AuthenticationProps['inviteData']
  onRegister?: AuthenticationProps['onRegister']
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  const [fullName, setFullName] = useState(form.fullName)
  const [password, setPassword] = useState(form.password)
  const [confirmPassword, setConfirmPassword] = useState(form.confirmPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!inviteData || !inviteData.isValid) {
    return <InviteExpiredScreen onNavigate={onNavigate} />
  }

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`You've been invited to join ${inviteData.teamName}`}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-indigo-200/30 bg-indigo-50/40 px-4 py-3 dark:border-indigo-800/20 dark:bg-indigo-950/20">
          <p className="text-[11px] font-semibold text-indigo-500/70 dark:text-indigo-400/60">
            Invited by
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {inviteData.invitedByName}
          </p>
        </div>

        <InputField
          label="Email"
          type="email"
          value={inviteData.invitedEmail}
          onChange={() => {}}
          icon={Mail}
          disabled
        />

        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={setFullName}
          icon={User}
        />

        <div>
          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={setPassword}
            icon={Lock}
            rightElement={
              <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
            }
          />
          <PasswordStrength password={password} />
        </div>

        <InputField
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={Lock}
          error={passwordMismatch ? 'Passwords do not match' : undefined}
          rightElement={
            <PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          }
        />

        <PrimaryButton
          onClick={() => onRegister?.(fullName, password)}
          disabled={!fullName || !password || password !== confirmPassword}
        >
          Create Account
        </PrimaryButton>

        <p className="text-center text-sm text-slate-400 dark:text-slate-500">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate?.('login')}
            className="font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}

/* ─── Forgot Password Screen ─── */

function ForgotPasswordScreen({
  form,
  onForgotPassword,
  onNavigate,
}: {
  form: AuthenticationProps['forgotPasswordForm']
  onForgotPassword?: AuthenticationProps['onForgotPassword']
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  const [email, setEmail] = useState(form.email)

  if (form.submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a password reset link">
        <div className="space-y-5">
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-emerald-200/40 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-950/30">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              We've sent a reset link to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {form.email}
              </span>
              . Check your inbox and follow the link to reset your password.
            </p>
          </div>

          <button
            onClick={() => onNavigate?.('login')}
            className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <div className="space-y-5">
        {form.error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200/40 bg-rose-50/60 px-4 py-3 text-sm font-medium text-rose-500 dark:border-rose-800/30 dark:bg-rose-950/30">
            <AlertCircle className="size-4 shrink-0" />
            {form.error}
          </div>
        )}

        <InputField
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          icon={Mail}
        />

        <PrimaryButton onClick={() => onForgotPassword?.(email)}>
          Send Reset Link
        </PrimaryButton>

        <button
          onClick={() => onNavigate?.('login')}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </button>
      </div>
    </AuthLayout>
  )
}

/* ─── Reset Password Screen ─── */

function ResetPasswordScreen({
  form,
  onResetPassword,
  onNavigate,
}: {
  form: AuthenticationProps['resetPasswordForm']
  onResetPassword?: AuthenticationProps['onResetPassword']
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  const [newPassword, setNewPassword] = useState(form.newPassword)
  const [confirmPassword, setConfirmPassword] = useState(form.confirmPassword)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter a new password for your account"
    >
      <div className="space-y-5">
        <div>
          <InputField
            label="New Password"
            type={showNew ? 'text' : 'password'}
            placeholder="Enter new password"
            value={newPassword}
            onChange={setNewPassword}
            icon={Lock}
            rightElement={
              <PasswordToggle show={showNew} onToggle={() => setShowNew(!showNew)} />
            }
          />
          <PasswordStrength password={newPassword} />
        </div>

        <InputField
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={Lock}
          error={mismatch ? 'Passwords do not match' : undefined}
          rightElement={
            <PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          }
        />

        <PrimaryButton
          onClick={() => onResetPassword?.(newPassword)}
          disabled={!newPassword || newPassword !== confirmPassword}
        >
          Reset Password
        </PrimaryButton>

        <button
          onClick={() => onNavigate?.('login')}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </button>
      </div>
    </AuthLayout>
  )
}

/* ─── Email Verification Screen ─── */

function EmailVerificationScreen({
  verification,
  onResendVerification,
  onNavigate,
}: {
  verification: AuthenticationProps['emailVerification']
  onResendVerification?: AuthenticationProps['onResendVerification']
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  const [cooldown, setCooldown] = useState(verification.resendCooldownSeconds)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = () => {
    onResendVerification?.()
    setCooldown(60)
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="One more step to complete your registration"
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-indigo-200/40 bg-indigo-50/60 dark:border-indigo-800/30 dark:bg-indigo-950/30">
            <Mail className="size-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            We've sent a verification email to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {verification.email}
            </span>
            . Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <SecondaryButton onClick={handleResend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Email'}
        </SecondaryButton>

        <button
          onClick={() => onNavigate?.('login')}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </button>
      </div>
    </AuthLayout>
  )
}

/* ─── Invite Expired Screen ─── */

function InviteExpiredScreen({
  onNavigate,
}: {
  onNavigate?: AuthenticationProps['onNavigate']
}) {
  return (
    <AuthLayout title="Invite link expired" subtitle="This link is no longer valid">
      <div className="space-y-5">
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-amber-200/40 bg-amber-50/60 dark:border-amber-800/30 dark:bg-amber-950/30">
            <ShieldAlert className="size-8 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            This invite link has expired or is invalid. Please contact your team
            leader to request a new invitation.
          </p>
        </div>

        <button
          onClick={() => onNavigate?.('login')}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </button>
      </div>
    </AuthLayout>
  )
}
