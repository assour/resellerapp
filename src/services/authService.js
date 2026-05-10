import { demoMode } from '../config';
import { demoStore } from './storage';

export async function getCurrentUser() {
  if (demoMode) return demoStore.getUser();
  console.warn('Auth backend is unavailable in this local build. Using demo user.');
  return demoStore.getUser();
}
