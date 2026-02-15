export const getDailyCountOption = (data) => {
  if (!data || !data.dates || !data.counts) return null;
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.dates },
    yAxis: { type: 'value' },
    series: [{
      data: data.counts,
      type: 'line',
      smooth: true,
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#eef2ff' }]
        }
      }
    }]
  };
};

export const getWeeklyCountOption = (data) => {
  if (!data || !data.weeks || !data.counts) return null;
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.weeks },
    yAxis: { type: 'value' },
    series: [{
      data: data.counts,
      type: 'line',
      smooth: true,
      itemStyle: { color: '#8b5cf6' }
    }]
  };
};

export const getTypeDistributionOption = (data) => {
  if (!data) return null;
  return {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: 'Types',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: '20', fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: data
    }]
  };
};

export const getSmellDistributionOption = (data) => {
  if (!data || !data.categories || !data.values) return null;
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: data.categories },
    yAxis: { type: 'value' },
    series: [{
      data: data.values,
      type: 'bar',
      showBackground: true,
      backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' },
      itemStyle: { color: '#ec4899' }
    }]
  };
};

export const getHourlyHeatmapOption = (data) => {
  if (!data) return null;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    tooltip: { position: 'top' },
    grid: { height: '50%', top: '10%' },
    xAxis: { type: 'category', data: hours, splitArea: { show: true } },
    yAxis: { type: 'category', data: days, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%'
    },
    series: [{
      name: 'Heatmap',
      type: 'heatmap',
      data: data.map(item => [item[0], item[1], item[2] || '-']),
      label: { show: true },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }]
  };
};

export const getDurationDistributionOption = (data) => {
  if (!data) return null;
  return {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: 'Duration',
      type: 'pie',
      radius: '50%',
      data: data,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }]
  };
};

export const getCrossAnalysisOption = (data) => {
  if (!data) return null;
  return {
    tooltip: {
      formatter: (params) => {
        const meta = params.data.meta;
        return `Smell: ${meta.smell}<br/>Duration: ${meta.duration}<br/>Temp: ${meta.temperature}<br/>Moist: ${meta.moisture}`;
      }
    },
    xAxis: { 
      type: 'value', 
      name: 'Duration',
      min: 0, max: 5,
      splitLine: { show: false } 
    },
    yAxis: { 
      type: 'value', 
      name: 'Smell',
      min: 0, max: 5,
      splitLine: { show: false } 
    },
    series: [{
      symbolSize: 20,
      data: data,
      type: 'scatter'
    }]
  };
};
