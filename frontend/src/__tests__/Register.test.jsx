import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../services/api';

jest.mock('../services/api', () => ({
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders register form', () => {
    renderWithAuth(<Register />);
    expect(screen.getByLabelText(/login.username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^login.password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/register.confirmPassword/i)).toBeInTheDocument();
  });

  test('shows error when passwords do not match', async () => {
    renderWithAuth(<Register />);
    
    fireEvent.change(screen.getByLabelText(/login.username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/^login.password$/i), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText(/register.confirmPassword/i), { target: { value: 'pass456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /register.title/i }));

    await waitFor(() => {
      expect(screen.getByText('register.passwordsDoNotMatch')).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  test('calls register api on valid submit', async () => {
    api.post.mockResolvedValueOnce({ 
      data: { token: 'abc', user: { username: 'newuser' } } 
    });

    renderWithAuth(<Register />);
    
    fireEvent.change(screen.getByLabelText(/login.username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/^login.password$/i), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText(/register.confirmPassword/i), { target: { value: 'pass123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /register.title/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        password: 'pass123'
      });
    });
  });
});
