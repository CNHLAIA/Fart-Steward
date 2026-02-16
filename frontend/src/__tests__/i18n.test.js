import i18n from '../i18n';

describe('i18n Configuration', () => {
  test('i18n initializes correctly', () => {
    expect(i18n).toBeDefined();
    expect(i18n.isInitialized).toBe(true);
  });

  test('default language is Chinese', () => {
    expect(i18n.language).toBe('zh');
  });

  test('fallback language is English', () => {
    expect(i18n.options.fallbackLng).toContain('en');
  });

  test('translations load correctly', () => {
    expect(i18n.t('common.save', { lng: 'zh' })).toBe('保存');
    expect(i18n.t('common.cancel', { lng: 'zh' })).toBe('取消');
    expect(i18n.t('records.title', { lng: 'zh' })).toBe('屁管家');
    
    expect(i18n.t('common.save', { lng: 'en' })).toBe('Save');
    expect(i18n.t('common.cancel', { lng: 'en' })).toBe('Cancel');
    expect(i18n.t('records.title', { lng: 'en' })).toBe('Fart Manager');
  });

  test('all required translation keys exist', () => {
    const requiredKeys = [
      'common.save',
      'common.cancel',
      'common.delete',
      'common.edit',
      'common.loading',
      'nav.records',
      'nav.analytics',
      'nav.export',
      'nav.logout',
      'login.title',
      'login.username',
      'login.password',
      'login.submit',
      'login.noAccount',
      'register.title',
      'register.hasAccount',
      'records.title',
      'records.todayCount',
      'records.noRecords',
      'records.startTracking',
      'records.addFirst',
      'form.newTitle',
      'form.editTitle',
      'form.dateTime',
      'form.duration',
      'form.type',
      'form.smellLevel',
      'form.temperature',
      'form.moisture',
      'form.notes',
      'form.saveRecord',
      'form.saving',
    ];

    ['zh', 'en'].forEach((lang) => {
      requiredKeys.forEach((key) => {
        const translation = i18n.t(key, { lng: lang });
        expect(translation).not.toBe(key);
      });
    });
  });
});
