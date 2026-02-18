import type {
  LoginForm,
  InviteData,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  EmailVerification,
} from '@/types/authentication'

export const loginForm: LoginForm = {
  email: '',
  password: '',
  rememberMe: false,
  error: null,
}

export const loginFormWithError: LoginForm = {
  email: 'dina.rahma@company.com',
  password: '',
  rememberMe: false,
  error: 'Invalid email or password. Please try again.',
}

export const inviteData: InviteData = {
  teamName: 'Marketing Team — PT Anugerah Jaya',
  invitedEmail: 'newuser@company.com',
  invitedByName: 'Alex Morgan',
  isValid: true,
  expiresAt: '2026-02-23T23:59:59Z',
}

export const inviteDataExpired: InviteData = {
  teamName: 'Marketing Team — PT Anugerah Jaya',
  invitedEmail: 'expired@company.com',
  invitedByName: 'Alex Morgan',
  isValid: false,
  expiresAt: '2026-02-10T23:59:59Z',
}

export const registerForm: RegisterForm = {
  email: 'newuser@company.com',
  fullName: '',
  password: '',
  confirmPassword: '',
}

export const forgotPasswordForm: ForgotPasswordForm = {
  email: '',
  submitted: false,
  error: null,
}

export const forgotPasswordFormSuccess: ForgotPasswordForm = {
  email: 'dina.rahma@company.com',
  submitted: true,
  error: null,
}

export const resetPasswordForm: ResetPasswordForm = {
  newPassword: '',
  confirmPassword: '',
  tokenValid: true,
}

export const emailVerification: EmailVerification = {
  email: 'newuser@company.com',
  isVerified: false,
  resendCooldownSeconds: 0,
}

export const emailVerificationResent: EmailVerification = {
  email: 'newuser@company.com',
  isVerified: false,
  resendCooldownSeconds: 55,
}
