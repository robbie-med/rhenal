// src/components/PatientInfoPanel.jsx
import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';

const PatientInfoPanel = () => {
  const patient = useGameStore(state => state.patient);
  const [showDetails, setShowDetails] = useState(false);
  
  if (!patient.demographics.name) {
    return (
      <div className="patient-info-panel bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/5"></div>
      </div>
    );
  }
  
  return (
    <div className="patient-info-panel bg-white p-4 rounded-lg shadow">
      {/* Patient header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{patient.demographics.name}</h2>
          <p className="text-sm text-gray-600">
            {patient.demographics.age}y, {patient.demographics.gender}, {patient.demographics.weight} kg, {patient.demographics.height} cm
          </p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {patient.location}
        </span>
      </div>
      
      {/* Chief complaint / clinical context */}
      <div className="border-l-4 border-blue-500 pl-3 py-1 mb-3">
        <p className="text-gray-700">{patient.clinicalContext}</p>
      </div>
      
      {/* Toggle for additional details */}
      <button 
        className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none mb-2"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      
      {/* Expandable details section */}
      {showDetails && (
        <div className="mt-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Past medical history */}
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Past Medical History</h3>
              <p className="text-gray-600 whitespace-pre-line">{patient.history}</p>
            </div>
            
            {/* Comorbidities */}
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Comorbidities</h3>
              {patient.comorbidities.length > 0 ? (
                <ul className="list-disc pl-5 text-gray-600">
                  {patient.comorbidities.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">None reported</p>
              )}
            </div>
          </div>
          
          {/* Allergies */}
          <div className="mt-3">
            <h3 className="font-medium text-gray-700 mb-1">Allergies</h3>
            {patient.allergies && patient.allergies.length > 0 ? (
              <ul className="text-gray-600">
                {patient.allergies.map((allergy, index) => (
                  <li key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-2 mb-2">
                    {allergy}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No known allergies</p>
            )}
          </div>
          
          {/* Baseline values */}
          {patient.baselineCreatinine && (
            <div className="mt-3">
              <h3 className="font-medium text-gray-700 mb-1">Baseline Values</h3>
              <p className="text-gray-600">
                Baseline Creatinine: {patient.baselineCreatinine} mg/dL
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientInfoPanel;
