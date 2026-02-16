import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordList from '../pages/RecordList'; // Assuming this is the page component
import api from '../services/api';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../services/api');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RecordList Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock records response
    api.get.mockImplementation((url) => {
        if (url.includes('/records')) {
            return Promise.resolve({
                data: {
                    items: [
                        { id: 1, timestamp: '2023-01-01T10:00:00Z', type_name: 'Normal', smell_level: 'mild' },
                        { id: 2, timestamp: '2023-01-01T11:00:00Z', type_name: 'Loud', smell_level: 'stinky' }
                    ],
                    total: 2,
                    page: 1,
                    per_page: 20
                }
            });
        }
        return Promise.reject(new Error('not found'));
    });
  });

  test('renders list of records', async () => {
    render(
      <BrowserRouter>
        <RecordList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Loud')).toBeInTheDocument();
    });
  });

  test('handles delete action', async () => {
    api.get.mockResolvedValue({
      data: {
        items: [
          { id: 1, timestamp: '2023-01-01T10:00:00Z', type_name: 'Normal', smell_level: 'mild' }
        ],
        total: 1,
        page: 1,
        per_page: 20
      }
    });
    api.delete.mockResolvedValue({});
    window.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <RecordList />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Normal')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByLabelText(/common.delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/records/1');
    });
  });

  test('shows empty state when no records', async () => {
    api.get.mockResolvedValue({
        data: {
            items: [],
            total: 0,
            page: 1,
            per_page: 20
        }
    });

    render(
      <BrowserRouter>
        <RecordList />
      </BrowserRouter>
    );

    expect(await screen.findByText(/records.noRecords/i)).toBeInTheDocument();
  });
});
