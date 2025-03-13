// src/components/MainGameLayout.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';
import VitalsDisplay from './VitalsDisplay';
import LabResultsPanel from './LabResultsPanel';
import InterventionsPanel from './InterventionsPanel';
import IOTrackingPanel from './IOTrackingPanel';
import ActionsPanel from './ActionsPanel';
import CommunicationPanel from './CommunicationPanel';
import TimeControlPanel from './TimeControlPanel';
import PatientInfoPanel from './PatientInfoPanel';

const MainGameLayout = () => {
  const isLoading = useGameStore(state => state.isLoading);
  const error = useGameStore(state => state.error);
  const initializeGame = useGameStore(state => state.initializeGame);
  const apiCost = useGameStore(state => state.apiCost);
  const score = useGameStore(state => state.score);
  const gameTime = useGameStore(state => state.gameTime);
  const { formatGameTime } = useGameTime();
  
  const [showIOPanel, setShowIOPanel] = useState(false);
  const [showLabPanel, setShowLabPanel] = useState(false);
  
  // Initialize the game on component mount
  useEffect(() => {
    // Only initialize if not already initialized (check if patient name exists)
    if (!useGameStore.getState().patient.demographics.name) {
      initializeGame();
    }
  }, [initializeGame]);
  
  // Toggle panels for mobile/smaller screens
  const toggleIOPanel = () => {
    setShowIOPanel(!showIOPanel);
    if (!showIOPanel) setShowLabPanel(false);
  };
  
  const toggleLabPanel = () => {
    setShowLabPanel(!showLabPanel);
    if (!showLabPanel) setShowIOPanel(false);
  };
  
  return (
    <div className="main-game-layout min-h-screen bg-gray-100">
      {/* Header with game info */}
      <header className="bg-blue-800 text-white p-3 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Nephrology Clinical Simulator</h1>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="opacity-80">API Cost:</span> ${apiCost.toFixed(2)}
            </div>
            <div className="text-sm">
              <span className="opacity-80">Score:</span> {score}
            </div>
            <div className="text-sm">
              <span className="opacity-80">Time:</span> {formatGameTime(gameTime)}
            </div>
          </div>
        </div>
      </header>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Processing clinical data...</p>
          </div>
        </div>
      )}
      
      {/* Error notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 z-50 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Time Control Panel */}
      <TimeControlPanel />
      
      {/* Main content grid */}
      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Patient Data & Vitals */}
        <div className="space-y-4">
          <PatientInfoPanel />
          <VitalsDisplay />
          
          {/* Mobile-only toggle buttons */}
          <div className="flex space-x-2 lg:hidden">
            <button 
              className={`flex-1 p-2 rounded text-sm font-medium ${showIOPanel ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={toggleIOPanel}
            >
              {showIOPanel ? 'Hide I/O Panel' : 'Show I/O Panel'}
            </button>
            <button 
              className={`flex-1 p-2 rounded text-sm font-medium ${showLabPanel ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={toggleLabPanel}
            >
              {showLabPanel ? 'Hide Lab Results' : 'Show Lab Results'}
            </button>
          </div>
          
          {/* Mobile view for toggled panels */}
          {showIOPanel && (
            <div className="lg:hidden">
              <IOTrackingPanel />
            </div>
          )}
          
          {showLabPanel && (
            <div className="lg:hidden">
              <LabResultsPanel />
            </div>
          )}
        </div>
        
        {/* Middle Column: Results & I/O */}
        <div className="space-y-4 hidden lg:block">
          <LabResultsPanel />
          <IOTrackingPanel />
        </div>
        
        {/* Right Column: Actions & Communications */}
        <div className="space-y-4">
          <ActionsPanel />
          <InterventionsPanel />
          <CommunicationPanel />
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white p-2 text-center text-xs mt-8">
        <p>Nephrology Clinical Simulator for Medical Education</p>
      </footer>
    </div>
  );
};

export default MainGameLayout;
