import authReducer, {
  setUser,
  clearUser,
  setAuthError,
  setAuthLoading,
} from '@/store/slices/authSlice';
import type { UserProfile } from '@/types/auth';

/**
 * authSlice reducer tests — verify state transitions for
 * setUser, clearUser, setAuthError, and setAuthLoading.
 */
const mockUser: UserProfile = {
  id: '507f1f77bcf86cd799439011',
  name: 'Jane Doe',
  email: 'jane@test.com',
  role: 'candidate',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('authSlice reducer', () => {
  it('returns the initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('setUser sets the user and marks as authenticated', () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe('authenticated');
    expect(state.error).toBeNull();
  });

  it('clearUser removes the user and marks as unauthenticated', () => {
    const authedState = authReducer(undefined, setUser(mockUser));
    const state = authReducer(authedState, clearUser());
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
    expect(state.error).toBeNull();
  });

  it('setAuthError sets an error message', () => {
    const state = authReducer(undefined, setAuthError('Invalid credentials'));
    expect(state.error).toBe('Invalid credentials');
  });

  it('setAuthError can clear the error with null', () => {
    const erroredState = authReducer(undefined, setAuthError('Bad'));
    const state = authReducer(erroredState, setAuthError(null));
    expect(state.error).toBeNull();
  });

  it('setAuthLoading sets status to loading', () => {
    const state = authReducer(undefined, setAuthLoading());
    expect(state.status).toBe('loading');
  });
});
