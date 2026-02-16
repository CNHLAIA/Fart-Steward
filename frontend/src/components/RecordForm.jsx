import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const DURATIONS = ['very_short', 'short', 'medium', 'long'];
const SMELL_LEVELS = ['mild', 'tolerable', 'stinky', 'extremely_stinky'];
const TEMPERATURES = ['hot', 'cold'];
const MOISTURES = ['dry', 'moist'];

export default function RecordForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    duration: 'short',
    type_id: '',
    smell_level: 'tolerable',
    temperature: 'hot',
    moisture: 'dry',
    notes: ''
  });
  
  const [customType, setCustomType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesResponse = await api.get('/fart-types');
        setTypes(typesResponse.data);
        
        if (id) {
          const recordResponse = await api.get(`/records/${id}`);
          const record = recordResponse.data;
          setFormData({
            ...record,
            timestamp: record.timestamp.slice(0, 16)
          });
        } else if (typesResponse.data.length > 0) {
           setFormData(prev => ({ ...prev, type_id: typesResponse.data[0].id }));
        }
      } catch (err) {
        setError(t('common.error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let submitData = { ...formData };
      
      if (isCustomType && customType) {
        // Future implementation: Create new type via API
        console.log('Custom type requested:', customType);
      }

      if (id) {
        await api.put(`/records/${id}`, submitData);
      } else {
        await api.post('/records', submitData);
      }
      navigate('/records');
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !types.length) return <div className="p-4">{t('common.loading')}</div>;

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-purple-600 text-white">
        <h2 className="text-xl font-bold">{id ? t('form.editTitle') : t('form.newTitle')}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        
        <div>
          <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">{t('form.dateTime')}</label>
          <input
            id="timestamp"
            type="datetime-local"
            required
            value={formData.timestamp}
            onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.duration')}</label>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFormData({...formData, duration: val})}
                className={`px-3 py-2 text-sm rounded-md border ${
                  formData.duration === val
                    ? 'bg-purple-100 border-purple-500 text-purple-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t(`form.durationOptions.${val}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type-select">{t('form.type')}</label>
          {isCustomType ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder={t('form.typeSelect.placeholder')}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setIsCustomType(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <select
              id="type-select"
              required
              value={formData.type_id}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsCustomType(true);
                } else {
                  setFormData({...formData, type_id: e.target.value});
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="new">{t('form.typeSelect.addNew')}</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.smellLevel')}</label>
          <div className="grid grid-cols-2 gap-2">
            {SMELL_LEVELS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFormData({...formData, smell_level: val})}
                className={`px-3 py-2 text-sm rounded-md border ${
                  formData.smell_level === val
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t(`form.smellLevelOptions.${val}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.temperature')}</label>
              <div className="flex rounded-md shadow-sm" role="group">
                {TEMPERATURES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({...formData, temperature: val})}
                    className={`flex-1 px-3 py-2 text-sm border first:rounded-l-md last:rounded-r-md ${
                      formData.temperature === val
                        ? 'bg-red-100 border-red-500 text-red-700 z-10'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(`form.temperatureOptions.${val}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.moisture')}</label>
              <div className="flex rounded-md shadow-sm" role="group">
                {MOISTURES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({...formData, moisture: val})}
                    className={`flex-1 px-3 py-2 text-sm border first:rounded-l-md last:rounded-r-md ${
                      formData.moisture === val
                        ? 'bg-blue-100 border-blue-500 text-blue-700 z-10'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(`form.moistureOptions.${val}`)}
                  </button>
                ))}
              </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">{t('form.notes')}</label>
          <textarea
            id="notes"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder={t('form.notes')}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {loading ? t('form.saving') : t('form.saveRecord')}
          </button>
        </div>
      </form>
    </div>
  );
}
