import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordForm from '../components/RecordForm';
import api from '../services/api';
import { BrowserRouter } from 'react-router-dom';

// Mock API
jest.mock('../services/api');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: undefined }), // default to create mode
}));

describe('RecordForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for fetching types
    api.get.mockResolvedValue({
      data: [
        { id: 1, name: 'Normal', is_preset: true },
        { id: 2, name: 'Loud', is_preset: true }
      ]
    });
  });

  test('renders form with initial values', async () => {
    render(
      <BrowserRouter>
        <RecordForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/form.dateTime/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/^form.duration$/)).toBeInTheDocument();
    expect(screen.getByText(/^form.smellLevel$/)).toBeInTheDocument();
    expect(screen.getByText(/^form.temperature$/)).toBeInTheDocument();
    expect(screen.getByText(/^form.moisture$/)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/fart-types');
    });
  });

  test('submits form with correct data', async () => {
    api.post.mockResolvedValue({ data: { id: 1 } });

    render(
      <BrowserRouter>
        <RecordForm />
      </BrowserRouter>
    );

    // Wait for types to load
    await waitFor(() => screen.getByText('Normal'));

    // Fill form
    // Note: implementation details might vary (e.g., select vs buttons), assuming accessible names
    
    // Select type
    fireEvent.change(screen.getByRole('combobox', { name: /form.type/i }), { target: { value: '1' } });
    
    // Select duration (assuming radio or buttons)
    const shortDuration = screen.getByRole('button', { name: 'form.durationOptions.short' });
    fireEvent.click(shortDuration);

    // Select smell
    const mildSmell = screen.getByRole('button', { name: 'form.smellLevelOptions.mild' });
    fireEvent.click(mildSmell);

    // Notes
    fireEvent.change(screen.getByLabelText(/form.notes/i), { target: { value: 'Test note' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /form.saveRecord/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/records', expect.objectContaining({
        type_id: '1',
        notes: 'Test note'
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/records');
    });
  });

  test('handles API errors', async () => {
    api.post.mockRejectedValue(new Error('API Error'));
    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <RecordForm />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText('Normal'));

    fireEvent.click(screen.getByRole('button', { name: /form.saveRecord/i }));

    await waitFor(() => {
        // Expect some error handling, maybe an alert or error message
        // For now just check post was called
        expect(api.post).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });
});
