// src/components/TimeControlPanel.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';

const TimeControlPanel = () => {
  const timeScale = useGameStore(state => state.timeScale);
  const setTimeScale = useGameStore(state => state.setTimeScale);
  const gameTime = useGameStore(state => state.gameTime);
  
  const { isRunning, toggleGameClock, formatGameTime } = useGameTime();
  
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  // Calculate elapsed time since game started
  useEffect(() => {
    // Assuming the game started at the current date minus the current time
    const gameStartTime = new Date();
    gameStartTime.setHours(0, 0, 0, 0);
    
    const elapsedMs = gameTime.getTime() - gameStartTime.getTime();
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
    
    setElapsed({ hours, minutes, seconds });
  }, [gameTime]);
  
  // Format the elapsed time
  const formatElapsed = () => {
    return `${elapsed.hours.toString().padStart(2, '0')}:${elapsed.minutes.toString().padStart(2, '0')}:${elapsed.seconds.toString().padStart(2, '0')}`;
  };
  
  // Time scale options
  const timeScaleOptions = [
    { value: 0.5, label: '0.5x (Slow)' },
    { value: 1, label: '1x (Real-time)' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
    { value: 30, label: '30x (Fast)' }
  ];
  
  return (
    <div className="time-control-panel bg-white shadow-sm border-b border-gray-200 p-2 sticky top-0 z-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        {/* Current game time display */}
        <div className="flex items-center space-x-4">
          <div className="text-gray-700">
            <span className="font-medium">Game Time:</span> {formatGameTime(gameTime)}
          </div>
          <div className="text-gray-700">
            <span className="font-medium">Elapsed:</span> {formatElapsed()}
          </div>
        </div>
        
        {/* Time scale controls */}
        <div className="flex items-center space-x-4">
          {/* Play/Pause button */}
          <button 
            className={`p-2 rounded-full focus:outline-none ${isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
            onClick={toggleGameClock}
            title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Time scale selector */}
          <div className="flex items-center">
            <label htmlFor="time-scale" className="text-sm font-medium text-gray-700 mr-2">Speed:</label>
            <select
              id="time-scale"
              className="p-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            >
              {timeScaleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time scale visual indicator */}
          <div className="hidden md:block">
            <div className="w-32 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full"
                style={{ 
                  width: `${Math.min(100, (timeScale / timeScaleOptions[timeScaleOptions.length - 1].value) * 100)}%`,
                  transition: 'width 0.3s ease' 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeControlPanel;
