// src/components/LabResultsPanel.jsx
import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';

const LabResultsPanel = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [showTrending, setShowTrending] = useState(false);
  const [trendingLab, setTrendingLab] = useState(null);
  
  const labs = useGameStore(state => state.labs);
  const { formatGameTime } = useGameTime();
  
  // Tabs for lab categories
  const labCategories = [
    { id: 'basic', label: 'Basic' },
    { id: 'renal', label: 'Renal' },
    { id: 'cbc', label: 'CBC' },
    { id: 'coags', label: 'Coags' },
    { id: 'urinalysis', label: 'Urine' },
    { id: 'abg', label: 'ABG' },
  ];
  
  // Get labs for the current category
  const currentCategoryLabs = labs[activeTab] || {};
  
  // Function to determine if a value is abnormal
  const isAbnormal = (value, referenceRange) => {
    if (!referenceRange || !value) return false;
    
    // Handle ranges like "3.5-5.0"
    if (referenceRange.includes('-')) {
      const [min, max] = referenceRange.split('-').map(v => parseFloat(v));
      return value < min || value > max;
    }
    
    // Handle ranges like ">60"
    if (referenceRange.includes('>')) {
      const threshold = parseFloat(referenceRange.replace('>', ''));
      return value <= threshold;
    }
    
    // Handle ranges like "<20"
    if (referenceRange.includes('<')) {
      const threshold = parseFloat(referenceRange.replace('<', ''));
      return value >= threshold;
    }
    
    return false;
  };
  
  // Get the trend data for a specific lab
  const getLabTrend = (labName) => {
    // Find all history entries for this lab
    return labs.history
      .filter(entry => entry.name === labName)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(entry => ({
        timestamp: formatGameTime(entry.timestamp),
        value: entry.value,
        isCritical: entry.isCritical
      }));
  };
  
  // Toggle trending view for a specific lab
  const toggleTrending = (labName) => {
    if (trendingLab === labName && showTrending) {
      setShowTrending(false);
      setTrendingLab(null);
    } else {
      setShowTrending(true);
      setTrendingLab(labName);
    }
  };
  
  // Render trend table for selected lab
  const renderTrendTable = () => {
    if (!showTrending || !trendingLab) return null;
    
    const trendData = getLabTrend(trendingLab);
    if (trendData.length <= 1) {
      return (
        <div className="mt-4 p-2 bg-gray-100 rounded text-center text-sm">
          Not enough data to show trending for {trendingLab}
        </div>
      );
    }
    
    return (
      <div className="mt-4 p-2 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">{trendingLab} Trend</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-1 text-left">Time</th>
                <th className="p-1 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((entry, index) => (
                <tr key={index} className={entry.isCritical ? 'bg-red-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-1">{entry.timestamp}</td>
                  <td className={`p-1 text-right ${entry.isCritical ? 'font-bold text-red-600' : ''}`}>
                    {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render a tab button
  const renderTabButton = (category) => {
    const hasResults = Object.keys(labs[category.id] || {}).length > 0;
    
    return (
      <button
        key={category.id}
        className={`px-3 py-1.5 text-sm font-medium rounded-t-lg 
          ${activeTab === category.id 
            ? 'bg-white border-t border-l border-r border-gray-300 text-blue-600' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} 
          ${!hasResults ? 'opacity-50' : ''}`}
        onClick={() => setActiveTab(category.id)}
        disabled={!hasResults}
      >
        {category.label}
      </button>
    );
  };
  
  return (
    <div className="lab-results bg-white rounded-lg shadow">
      {/* Lab category tabs */}
      <div className="tabs flex space-x-1 px-2 pt-2 bg-gray-50 rounded-t-lg border-b border-gray-300">
        {labCategories.map(renderTabButton)}
      </div>
      
      {/* Lab results content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">{labCategories.find(c => c.id === activeTab)?.label} Labs</h3>
        
        {Object.keys(currentCategoryLabs).length === 0 ? (
          <p className="text-gray-500 italic">No {activeTab} labs available yet</p>
        ) : (
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Test</th>
                  <th className="p-2 text-right">Value</th>
                  <th className="p-2 text-right">Units</th>
                  <th className="p-2 text-left">Reference</th>
                  <th className="p-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(currentCategoryLabs).map(([name, data]) => {
                  const abnormal = isAbnormal(data.value, data.referenceRange);
                  
                  return (
                    <tr 
                      key={name} 
                      className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${abnormal ? 'bg-red-50' : ''}`}
                      onClick={() => toggleTrending(name)}
                    >
                      <td className="p-2 font-medium">{name}</td>
                      <td className={`p-2 text-right ${abnormal ? 'font-bold text-red-600' : ''}`}>
                        {typeof data.value === 'number' ? data.value.toFixed(1) : data.value}
                      </td>
                      <td className="p-2 text-right text-gray-600">{data.units}</td>
                      <td className="p-2 text-gray-600">{data.referenceRange}</td>
                      <td className="p-2 text-right text-gray-500">
                        {formatGameTime(data.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Trending data */}
        {renderTrendTable()}
        
        {/* Order labs button */}
        <div className="mt-4 flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={() => {
              // This would open a lab ordering modal/dialog
              // We'll implement this in a separate component
            }}
          >
            Order Labs
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabResultsPanel;
