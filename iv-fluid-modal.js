// src/components/modals/IVFluidModal.jsx
import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';

const IVFluidModal = ({ onClose }) => {
  const [selectedFluid, setSelectedFluid] = useState(null);
  const [rate, setRate] = useState(100);
  const [duration, setDuration] = useState('');
  const [customFluid, setCustomFluid] = useState({
    name: '',
    composition: '',
    isValid: false
  });
  
  const startContinuousIV = useGameStore(state => state.startContinuousIV);
  const isLoading = useGameStore(state => state.isLoading);
  
  // Common IV fluids
  const commonFluids = [
    { 
      id: 'ns', 
      name: 'Normal Saline (0.9% NaCl)',
      composition: '0.9% NaCl (154 mEq/L Na, 154 mEq/L Cl)',
      osmolarity: '308 mOsm/L',
      tonicity: 'Isotonic'
    },
    { 
      id: 'half_ns', 
      name: '0.45% NaCl',
      composition: '0.45% NaCl (77 mEq/L Na, 77 mEq/L Cl)',
      osmolarity: '154 mOsm/L',
      tonicity: 'Hypotonic'
    },
    { 
      id: 'quarter_ns', 
      name: '0.225% NaCl',
      composition: '0.225% NaCl (38.5 mEq/L Na, 38.5 mEq/L Cl)',
      osmolarity: '77 mOsm/L',
      tonicity: 'Hypotonic'
    },
    { 
      id: 'd5w', 
      name: 'D5W',
      composition: '5% Dextrose in Water',
      osmolarity: '252 mOsm/L',
      tonicity: 'Hypotonic (after dextrose metabolism)'
    },
    { 
      id: 'd5ns', 
      name: 'D5 0.9% NaCl',
      composition: '5% Dextrose in 0.9% NaCl',
      osmolarity: '560 mOsm/L',
      tonicity: 'Hypertonic'
    },
    { 
      id: 'd5half', 
      name: 'D5 0.45% NaCl',
      composition: '5% Dextrose in 0.45% NaCl',
      osmolarity: '406 mOsm/L',
      tonicity: 'Hypotonic after dextrose metabolism'
    },
    { 
      id: 'lr', 
      name: 'Lactated Ringer\'s',
      composition: '130 mEq/L Na, 4 mEq/L K, 2.7 mEq/L Ca, 109 mEq/L Cl, 28 mEq/L lactate',
      osmolarity: '273 mOsm/L',
      tonicity: 'Isotonic'
    },
    { 
      id: 'd5lr', 
      name: 'D5 Lactated Ringer\'s',
      composition: '5% Dextrose in Lactated Ringer\'s',
      osmolarity: '525 mOsm/L',
      tonicity: 'Hypertonic'
    },
    { 
      id: 'three_salt', 
      name: '3% NaCl',
      composition: '3% NaCl (513 mEq/L Na, 513 mEq/L Cl)',
      osmolarity: '1026 mOsm/L',
      tonicity: 'Hypertonic'
    }
  ];
  
  // Common rate presets
  const ratePresets = [
    { value: 50, label: '50 mL/hr' },
    { value: 75, label: '75 mL/hr' },
    { value: 100, label: '100 mL/hr' },
    { value: 125, label: '125 mL/hr' },
    { value: 150, label: '150 mL/hr' },
    { value: 200, label: '200 mL/hr' },
    { value: 250, label: '250 mL/hr' },
    { value: 500, label: '500 mL/hr (KVO)' },
  ];
  
  // Handle duration input
  const handleDurationChange = (e) => {
    // Allow empty string or positive numbers
    const value = e.target.value;
    if (value === '' || (Number(value) > 0 && Number(value) <= 1440)) {
      setDuration(value);
    }
  };
  
  // Handle custom fluid input
  const handleCustomFluidChange = (e) => {
    const { name, value } = e.target;
    const updatedCustomFluid = {
      ...customFluid,
      [name]: value
    };
    
    // Check if custom fluid is valid (both name and composition must be filled)
    updatedCustomFluid.isValid = updatedCustomFluid.name.trim() !== '' && updatedCustomFluid.composition.trim() !== '';
    
    setCustomFluid(updatedCustomFluid);
  };
  
  // Handle fluid order submission
  const handleOrderFluid = async () => {
    // Ensure a fluid is selected and rate is valid
    if ((!selectedFluid && !customFluid.isValid) || rate <= 0) return;
    
    const fluidToOrder = selectedFluid || {
      id: 'custom',
      name: `${customFluid.name} (custom)`,
      composition: customFluid.composition
    };
    
    const fluidOrder = {
      name: fluidToOrder.name,
      rate: Number(rate),
      duration: duration ? Number(duration) : null // null means continuous until stopped
    };
    
    await startContinuousIV(fluidOrder);
    onClose();
  };
  
  return (
    <div className="iv-fluid-modal">
      {/* Modal header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Order IV Fluids</h2>
        <button 
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Modal body */}
      <div className="p-4">
        {/* Fluid selection */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Select IV Fluid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {commonFluids.map(fluid => (
              <div 
                key={fluid.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedFluid && selectedFluid.id === fluid.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedFluid(fluid);
                  setCustomFluid({ name: '', composition: '', isValid: false });
                }}
              >
                <div className="font-medium">{fluid.name}</div>
                <div className="text-xs text-gray-600">{fluid.composition}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {fluid.osmolarity} ({fluid.tonicity})
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom fluid option */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Or Enter Custom Fluid</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fluid Name
                </label>
                <input 
                  type="text"
                  name="name"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., D5 1/2NS + 20 mEq KCl"
                  value={customFluid.name}
                  onChange={handleCustomFluidChange}
                  onClick={() => setSelectedFluid(null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Composition
                </label>
                <input 
                  type="text"
                  name="composition"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5% Dextrose in 0.45% NaCl + 20 mEq/L KCl"
                  value={customFluid.composition}
                  onChange={handleCustomFluidChange}
                  onClick={() => setSelectedFluid(null)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Rate and duration settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Rate selection */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Infusion Rate
            </label>
            <div className="flex items-center mb-2">
              <input 
                type="number"
                className="w-24 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                min="1"
                max="1000"
              />
              <span className="px-3 py-2 bg-gray-100 border-t border-r border-b border-gray-300 rounded-r">
                mL/hr
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ratePresets.map(preset => (
                <button
                  key={preset.value}
                  className={`px-2 py-1 text-xs rounded ${
                    rate === preset.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => setRate(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Duration selection */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Duration (leave empty for continuous)
            </label>
            <div className="flex items-center mb-2">
              <input 
                type="number"
                className="w-24 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
                value={duration}
                onChange={handleDurationChange}
                placeholder="∞"
                min="1"
                max="1440"
              />
              <span className="px-3 py-2 bg-gray-100 border-t border-r border-b border-gray-300 rounded-r">
                minutes
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-2 py-1 text-xs rounded ${
                  duration === ''
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => setDuration('')}
              >
                Continuous
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${
                  duration === '60'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => setDuration('60')}
              >
                1 hour
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${
                  duration === '240'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => setDuration('240')}
              >
                4 hours
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${
                  duration === '480'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => setDuration('480')}
              >
                8 hours
              </button>
            </div>
          </div>
        </div>
        
        {/* Selected fluid summary */}
        {(selectedFluid || customFluid.isValid) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-800 mb-1">Order Summary</h4>
            <div className="text-sm">
              <p><span className="font-medium">Fluid:</span> {selectedFluid ? selectedFluid.name : customFluid.name}</p>
              <p><span className="font-medium">Composition:</span> {selectedFluid ? selectedFluid.composition : customFluid.composition}</p>
              <p><span className="font-medium">Rate:</span> {rate} mL/hr</p>
              <p><span className="font-medium">Duration:</span> {duration ? `${duration} minutes` : 'Continuous until stopped'}</p>
              {duration && (
                <p><span className="font-medium">Total Volume:</span> {Math.round(rate * duration / 60)} mL</p>
              )}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${
              (selectedFluid || customFluid.isValid) && rate > 0 && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!(selectedFluid || customFluid.isValid) || rate <= 0 || isLoading}
            onClick={handleOrderFluid}
          >
            {isLoading ? 'Processing...' : 'Start IV Fluid'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVFluidModal;
