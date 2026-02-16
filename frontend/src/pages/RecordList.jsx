import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import RecordCard from '../components/RecordCard';

export default function RecordList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0 });
  const [todayCount, setTodayCount] = useState(0);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/records`, {
        params: {
          page: pagination.page,
          per_page: pagination.per_page
        }
      });
      setRecords(response.data.items);
      setPagination(prev => ({ ...prev, total: response.data.total }));
      
      const today = new Date().toDateString();
      const count = response.data.items.filter(r => new Date(r.timestamp).toDateString() === today).length;
      setTodayCount(count);
      
    } catch (err) {
      setError(t('common.error') || 'Failed to load records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, t]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id) => {
    if (window.confirm(t('common.deleteConfirm'))) {
      try {
        await api.delete(`/records/${id}`);
        fetchRecords();
      } catch (err) {
        alert(t('common.error') || 'Failed to delete record');
        console.error(err);
      }
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6 -mx-4 sm:mx-0 sm:rounded-3xl">
        <h1 className="text-3xl font-bold mb-2">{t('records.title')}</h1>
        <p className="opacity-90">{t('records.fartsToday')} <span className="text-2xl font-bold ml-1">{todayCount}</span></p>
      </div>

      <div className="px-4 sm:px-0">
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💨</div>
            <h3 className="text-xl font-medium text-gray-900">{t('records.noRecords')}</h3>
            <p className="text-gray-500 mt-2 mb-6">{t('records.startTracking')}</p>
            <button
              onClick={() => navigate('/records/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              {t('records.addFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <RecordCard key={record.id} record={record} onDelete={handleDelete} />
            ))}
            
            {records.length < pagination.total && (
                 <div className="text-center pt-4">
                    <button 
                        onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
                        className="text-purple-600 font-medium hover:text-purple-800"
                    >
                        {t('records.loadMore')}
                    </button>
                 </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/records/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 z-50 transition-transform hover:scale-105"
        aria-label={t('records.addFirst')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
