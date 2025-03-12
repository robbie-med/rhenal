// src/components/VitalsDisplay.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';

const VitalsDisplay = () => {
  const vitals = useGameStore(state => state.vitals);
  const { formatGameTime } = useGameTime();
  const [showTrend, setShowTrend] = useState(null);
  
  // Get the current vitals
  const current = vitals.current;
  
  // Get trend data (last 10 entries)
  const trendData = vitals.history
    .slice(-10)
    .map(record => ({
      time: formatGameTime(record.timestamp),
      hr: record.hr,
      sbp: record.sbp,
      dbp: record.dbp,
      map: record.map,
      rr: record.rr,
      temp: record.temp,
      spo2: record.spo2
    }));
  
  // Determine abnormal values
  const isAbnormal = {
    hr: current.hr < 60 || current.hr > 100,
    bp: current.sbp < 90 || current.sbp > 140 || current.dbp < 60 || current.dbp > 90,
    map: current.map < 65 || current.map > 110,
    rr: current.rr < 12 || current.rr > 20,
    temp: current.temp < 36 || current.temp > 38,
    spo2: current.spo2 < 92
  };
  
  // Get colors for values based on abnormality
  const getColor = (key) => {
    if (!current || !isAbnormal) return 'text-gray-900';
    if (isAbnormal[key]) return 'text-red-600 font-bold';
    return 'text-gray-900';
  };
  
  // Toggle trend display for a specific vital sign
  const toggleTrend = (vitalType) => {
    if (showTrend === vitalType) {
      setShowTrend(null);
    } else {
      setShowTrend(vitalType);
    }
  };
  
  // Get domain for chart based on vital type
  const getChartDomain = (vitalType) => {
    switch (vitalType) {
      case 'hr':
        return [Math.min(40, Math.min(...trendData.map(d => d.hr)) - 10), 
                Math.max(140, Math.max(...trendData.map(d => d.hr)) + 10)];
      case 'bp':
        return [Math.min(40, Math.min(...trendData.map(d => d.dbp)) - 10), 
                Math.max(180, Math.max(...trendData.map(d => d.sbp)) + 10)];
      case 'map':
        return [Math.min(50, Math.min(...trendData.map(d => d.map)) - 10), 
                Math.max(120, Math.max(...trendData.map(d => d.map)) + 10)];
      case 'rr':
        return [Math.min(8, Math.min(...trendData.map(d => d.rr)) - 4), 
                Math.max(30, Math.max(...trendData.map(d => d.rr)) + 4)];
      case 'temp':
        return [Math.min(35, Math.min(...trendData.map(d => d.temp)) - 0.5), 
                Math.max(40, Math.max(...trendData.map(d => d.temp)) + 0.5)];
      case 'spo2':
        return [Math.min(80, Math.min(...trendData.map(d => d.spo2)) - 5), 100];
      default:
        return [0, 100];
    }
  };
  
  // Render trend chart for selected vital
  const renderTrendChart = () => {
    if (!showTrend || trendData.length < 2) return null;
    
    let lines = [];
    let domain = [0, 100];
    
    switch (showTrend) {
      case 'hr':
        lines = [<Line type="monotone" dataKey="hr" stroke="#8884d8" dot={true} name="HR" key="hr" />];
        domain = getChartDomain('hr');
        break;
      case 'bp':
        lines = [
          <Line type="monotone" dataKey="sbp" stroke="#ff0000" dot={true} name="SBP" key="sbp" />,
          <Line type="monotone" dataKey="dbp" stroke="#0000ff" dot={true} name="DBP" key="dbp" />,
          <Line type="monotone" dataKey="map" stroke="#00c853" dot={true} name="MAP" key="map" strokeDasharray="5 5" />
        ];
        domain = getChartDomain('bp');
        break;
      case 'map':
        lines = [<Line type="monotone" dataKey="map" stroke="#00c853" dot={true} name="MAP" key="map" />];
        domain = getChartDomain('map');
        break;
      case 'rr':
        lines = [<Line type="monotone" dataKey="rr" stroke="#ff9800" dot={true} name="RR" key="rr" />];
        domain = getChartDomain('rr');
        break;
      case 'temp':
        lines = [<Line type="monotone" dataKey="temp" stroke="#e91e63" dot={true} name="Temp" key="temp" />];
        domain = getChartDomain('temp');
        break;
      case 'spo2':
        lines = [<Line type="monotone" dataKey="spo2" stroke="#2196f3" dot={true} name="SpO2" key="spo2" />];
        domain = getChartDomain('spo2');
        break;
      default:
        return null;
    }
    
    return (
      <div className="mt-2 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={domain} />
            <Tooltip />
            <Legend />
            {lines}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <div className="vitals-display bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Vital Signs</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* HR */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('hr')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">HR</span>
            <span className={`text-xl ${getColor('hr')}`}>{current.hr}</span>
          </div>
          <div className="text-xs text-gray-500">bpm</div>
        </div>
        
        {/* BP */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('bp')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">BP</span>
            <span className={`text-xl ${getColor('bp')}`}>
              {current.sbp}/{current.dbp}
            </span>
          </div>
          <div className="text-xs text-gray-500">mmHg</div>
        </div>
        
        {/* MAP */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('map')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">MAP</span>
            <span className={`text-xl ${getColor('map')}`}>{current.map}</span>
          </div>
          <div className="text-xs text-gray-500">mmHg</div>
        </div>
        
        {/* RR */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('rr')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">RR</span>
            <span className={`text-xl ${getColor('rr')}`}>{current.rr}</span>
          </div>
          <div className="text-xs text-gray-500">breaths/min</div>
        </div>
        
        {/* Temp */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('temp')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Temp</span>
            <span className={`text-xl ${getColor('temp')}`}>{current.temp.toFixed(1)}</span>
          </div>
          <div className="text-xs text-gray-500">°C</div>
        </div>
        
        {/* SpO2 */}
        <div 
          className="vital-box p-2 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => toggleTrend('spo2')}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">SpO2</span>
            <span className={`text-xl ${getColor('spo2')}`}>{current.spo2}%</span>
          </div>
          <div className="text-xs text-gray-500">oxygen saturation</div>
        </div>
      </div>
      
      {/* Trend chart */}
      {renderTrendChart()}
      
      {/* Last updated timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-right">
        Last updated: {formatGameTime(new Date())}
      </div>
    </div>
  );
};

export default VitalsDisplay;
