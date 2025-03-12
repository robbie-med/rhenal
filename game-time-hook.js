// src/hooks/useGameTime.js
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';

/**
 * Custom hook to manage game time and periodic updates
 * @param {number} realTimeInterval - Interval in milliseconds for real-time updates
 * @returns {Object} - Game time utilities
 */
const useGameTime = (realTimeInterval = 1000) => {
  const updateGameTime = useGameStore(state => state.updateGameTime);
  const updateVitals = useGameStore(state => state.updateVitals);
  const timeScale = useGameStore(state => state.timeScale);
  const gameTime = useGameStore(state => state.gameTime);
  
  const [isRunning, setIsRunning] = useState(true);
  const lastUpdateTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Start or stop the game clock
  const toggleGameClock = () => {
    setIsRunning(prev => !prev);
  };

  // Reset the last update time when the time scale changes
  useEffect(() => {
    lastUpdateTimeRef.current = Date.now();
  }, [timeScale]);

  // Main game loop
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateLoop = () => {
      const now = Date.now();
      const elapsedRealTimeMs = now - lastUpdateTimeRef.current;
      const elapsedRealTimeSec = elapsedRealTimeMs / 1000;
      
      // Update the game time based on elapsed real time and time scale
      updateGameTime(elapsedRealTimeSec);
      
      // Check if vitals need to be updated (every 10 seconds of game time)
      const elapsedGameTimeSec = elapsedRealTimeSec * timeScale;
      const shouldUpdateVitals = elapsedGameTimeSec >= 10;
      
      if (shouldUpdateVitals) {
        updateVitals();
      }
      
      lastUpdateTimeRef.current = now;
    };

    // Set up the interval for real-time updates
    intervalRef.current = setInterval(updateLoop, realTimeInterval);

    // Clean up the interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeScale, updateGameTime, updateVitals, realTimeInterval]);

  // Format the game time for display
  const formatGameTime = (date = gameTime) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  // Calculate the elapsed time since the game started
  const getElapsedTime = (startTime) => {
    const elapsedMs = gameTime.getTime() - startTime.getTime();
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  };

  return {
    gameTime,
    timeScale,
    isRunning,
    toggleGameClock,
    formatGameTime,
    getElapsedTime
  };
};

export default useGameTime;
