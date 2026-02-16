require("@testing-library/jest-dom");

jest.mock('react-i18next', () => {
  const t = (key) => key;
  return {
    useTranslation: () => ({
      t,
      i18n: {
        changeLanguage: jest.fn().mockResolvedValue(t),
        language: 'en',
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

