// src/components/InterventionsPanel.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';

const InterventionsPanel = () => {
  const interventions = useGameStore(state => state.interventions);
  const gameTime = useGameStore(state => state.gameTime);
  const stopContinuousIV = useGameStore(state => state.stopContinuousIV);
  
  const { formatGameTime, getElapsedTime } = useGameTime();
  const [expandedId, setExpandedId] = useState(null);
  
  // Local state for countdown display
  const [, setTick] = useState(0);
  
  // Keep the timer display updated
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Group interventions by type
  const groupedInterventions = {
    medications: interventions.filter(i => i.type === 'medication'),
    fluids: interventions.filter(i => i.type === 'fluid'),
    procedures: interventions.filter(i => i.type !== 'medication' && i.type !== 'fluid')
  };
  
  // Check if there are any active interventions
  const hasActiveInterventions = interventions.some(i => i.isActive);
  
  // Toggle expanded details for an intervention
  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };
  
  // Format duration from start time
  const formatDuration = (startTime) => {
    const elapsed = getElapsedTime(startTime);
    return elapsed.formatted;
  };
  
  // Calculate time remaining for timed interventions
  const calculateTimeRemaining = (intervention) => {
    if (!intervention.endTime) return 'Continuous';
    
    const remaining = intervention.endTime - gameTime;
    if (remaining <= 0) return 'Completed';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };
  
  // Render a section of interventions by type
  const renderInterventionSection = (title, interventions) => {
    if (interventions.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Dosage/Rate</th>
                <th className="p-2 text-left">Route</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-right">Started</th>
                <th className="p-2 text-right">Duration</th>
                <th className="p-2 text-right">Remaining</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => (
                <React.Fragment key={intervention.id}>
                  <tr 
                    className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer
                      ${intervention.isActive ? 'bg-green-50' : 'bg-gray-50 text-gray-500'}`}
                    onClick={() => toggleExpand(intervention.id)}
                  >
                    <td className="p-2 font-medium">{intervention.name}</td>
                    <td className="p-2">{intervention.dosage}</td>
                    <td className="p-2">{intervention.route}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs 
                        ${intervention.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'}`}>
                        {intervention.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 text-right">{formatGameTime(intervention.startTime)}</td>
                    <td className="p-2 text-right">{formatDuration(intervention.startTime)}</td>
                    <td className="p-2 text-right">
                      {intervention.isActive ? calculateTimeRemaining(intervention) : 'Completed'}
                    </td>
                    <td className="p-2 text-center">
                      {intervention.isActive && intervention.type === 'fluid' && (
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopContinuousIV(intervention.id);
                          }}
                        >
                          Stop
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded details row */}
                  {expandedId === intervention.id && (
                    <tr className="bg-gray-100">
                      <td colSpan="8" className="p-4">
                        <div className="text-sm">
                          <div className="font-medium mb-2">Intervention Details:</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p><span className="font-medium">Name:</span> {intervention.name}</p>
                              <p><span className="font-medium">Dosage/Rate:</span> {intervention.dosage}</p>
                              <p><span className="font-medium">Route:</span> {intervention.route}</p>
                              <p><span className="font-medium">Type:</span> {intervention.type}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Start Time:</span> {formatGameTime(intervention.startTime)}</p>
                              <p><span className="font-medium">Duration:</span> {formatDuration(intervention.startTime)}</p>
                              {intervention.endTime && (
                                <p>
                                  <span className="font-medium">End Time:</span> {
                                    intervention.isActive 
                                      ? formatGameTime(intervention.endTime) + ' (scheduled)' 
                                      : formatGameTime(intervention.endTime)
                                  }
                                </p>
                              )}
                              <p>
                                <span className="font-medium">Status:</span> {
                                  intervention.isActive 
                                    ? 'Active' 
                                    : `Inactive (${intervention.endTime ? 'completed' : 'discontinued'})`
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* Action buttons for expanded view */}
                          {intervention.isActive && (
                            <div className="mt-3 flex justify-end space-x-2">
                              {intervention.type === 'fluid' && (
                                <button
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  onClick={() => stopContinuousIV(intervention.id)}
                                >
                                  Stop Infusion
                                </button>
                              )}
                              {/* Add other action buttons as needed */}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="interventions-panel bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Interventions</h2>
        <div className="text-sm text-gray-600">
          {hasActiveInterventions 
            ? `${interventions.filter(i => i.isActive).length} active interventions` 
            : 'No active interventions'}
        </div>
      </div>
      
      {interventions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No interventions have been administered yet.</p>
          <p className="text-sm mt-2">Use the Actions Panel to order medications, fluids, or procedures.</p>
        </div>
      ) : (
        <>
          {renderInterventionSection('IV Fluids', groupedInterventions.fluids)}
          {renderInterventionSection('Medications', groupedInterventions.medications)}
          {renderInterventionSection('Procedures', groupedInterventions.procedures)}
        </>
      )}
    </div>
  );
};

export default InterventionsPanel;
