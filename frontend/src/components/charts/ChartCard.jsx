import React from 'react';
import ReactECharts from 'echarts-for-react';

const ChartCard = ({ title, option, loading, error }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 border-gray-100">{title}</h3>
      <div className="flex-grow flex items-center justify-center relative w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {error ? (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
            <p className="font-medium">Error loading chart</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : option ? (
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            theme="macarons"
          />
        ) : (
          <div className="text-gray-400 text-center">No data available</div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
