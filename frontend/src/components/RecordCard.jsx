import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SMELL_COLORS = {
  mild: 'bg-green-100 text-green-800',
  tolerable: 'bg-blue-100 text-blue-800',
  stinky: 'bg-yellow-100 text-yellow-800',
  extremely_stinky: 'bg-red-100 text-red-800',
};

export default function RecordCard({ record, onDelete }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const date = new Date(record.timestamp);
  
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString();

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">{dateString} {timeString}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SMELL_COLORS[record.smell_level] || 'bg-gray-100 text-gray-800'}`}>
            {t(`form.smellLevelOptions.${record.smell_level}`, record.smell_level)}
          </span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mt-1">{record.type_name || 'Unknown Type'}</h3>
        {record.notes && <p className="text-gray-500 text-sm mt-1 truncate">{record.notes}</p>}
      </div>
      
      <div className="flex space-x-2 ml-4">
        <button 
          onClick={() => navigate(`/records/${record.id}/edit`)}
          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
          aria-label={t('common.edit')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button 
          onClick={() => onDelete(record.id)}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          aria-label={t('common.delete')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
