import { authFetch, jsonOrThrow, setToken, clearToken } from './client';
import { API_BASE } from './config';

export interface UserInfo {
  id: string;
  nickname: string;
  phone: string;
  role: string;
  points?: number;
}

export interface AuthResponse {
  user: UserInfo;
  tokens: { access_token: string; refresh_token: string };
}

export async function login(phone: string, password: string): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/v1/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone, password_hash: password }),
  });
  const data = (await jsonOrThrow(res)) as AuthResponse;
  await setToken(data.tokens.access_token);
  return data.user;
}

export async function sendOtp(
  phone: string,
  purpose: 'register' | 'reset'
): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/users/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, purpose }),
  });
  await jsonOrThrow(res);
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: 'register' | 'reset'
): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/users/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, purpose }),
  });
  const data = await jsonOrThrow(res);
  return data.token as string;
}

export async function register(
  nickname: string,
  phone: string,
  password: string,
  otpToken: string
): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/v1/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      phone,
      password_hash: password,
      role: 'user',
      otp_token: otpToken,
    }),
  });
  const data = (await jsonOrThrow(res)) as AuthResponse;
  await setToken(data.tokens.access_token);
  return data.user;
}

export async function resetPassword(
  phone: string,
  otpToken: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/users/reset-pass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      otp_token: otpToken,
      password,
      confirm_password: confirmPassword,
    }),
  });
  await jsonOrThrow(res);
}

export async function fetchProfile(): Promise<UserInfo> {
  const res = await authFetch('/v1/users/profile', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return data.user as UserInfo;
}

export async function logout(): Promise<void> {
  await clearToken();
}
