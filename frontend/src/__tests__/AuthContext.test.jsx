import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

// Test component to consume the context
const TestComponent = () => {
  const { user, login, logout, register } = useAuth();
  return (
    <div>
      <div data-testid="user-display">{user ? user.username : 'No User'}</div>
      <button onClick={() => login('test', 'password')}>Login</button>
      <button onClick={() => register('test', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('provides initial state without user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('user-display')).toHaveTextContent('No User');
  });

  test('login updates user state and localStorage', async () => {
    const mockUser = { username: 'test', id: 1 };
    const mockToken = 'fake-token';
    api.post.mockResolvedValueOnce({ data: { user: mockUser, token: mockToken } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-display')).toHaveTextContent('test');
    });

    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('user')).toContain('test');
  });

  test('logout clears user state and localStorage', async () => {
    // Setup initial logged in state
    const mockUser = { username: 'test', id: 1 };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'fake-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial check (wait for useEffect to load from localStorage)
    await waitFor(() => {
      expect(screen.getByTestId('user-display')).toHaveTextContent('test');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user-display')).toHaveTextContent('No User');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
