import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../../src/components/LanguageSwitcher';

const mockChangeLanguage = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'zh',
      changeLanguage: mockChangeLanguage,
    },
    t: (key) => key,
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
    localStorage.clear();
  });

  test('renders current language', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  test('opens dropdown on click', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /中文/i });
    fireEvent.click(button);
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  test('changes language to English when selected', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /中文/i });
    fireEvent.click(button);
    
    const englishOption = screen.getByText('English');
    fireEvent.click(englishOption);

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
  });

  test('closes dropdown when clicking outside', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /中文/i });
    fireEvent.click(button);
    expect(screen.getByText('English')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });
});
