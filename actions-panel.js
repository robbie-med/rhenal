// src/components/ActionsPanel.jsx
import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';

// Modals
import MedicationModal from './modals/MedicationModal';
import LabOrderModal from './modals/LabOrderModal';
import IVFluidModal from './modals/IVFluidModal';
import ExamModal from './modals/ExamModal';
import ProcedureModal from './modals/ProcedureModal';

const ActionsPanel = () => {
  const [activeModal, setActiveModal] = useState(null);
  const score = useGameStore(state => state.score);
  
  // Action categories with their associated modals
  const actionCategories = [
    { 
      id: 'drugs', 
      label: 'Medications',
      icon: '💊',
      description: 'Order medications, infusions, and other therapeutics', 
      modal: 'medication' 
    },
    { 
      id: 'labs', 
      label: 'Labs & Diagnostics',
      icon: '🧪',
      description: 'Order labs, imaging, and other diagnostic tests', 
      modal: 'lab' 
    },
    { 
      id: 'fluids', 
      label: 'IV Fluids',
      icon: '💧',
      description: 'Manage fluid administration and electrolyte replacement', 
      modal: 'fluid' 
    },
    { 
      id: 'exam', 
      label: 'Physical Exam',
      icon: '👨‍⚕️',
      description: 'Perform physical examination maneuvers', 
      modal: 'exam' 
    },
    { 
      id: 'procedures', 
      label: 'Procedures',
      icon: '⚙️',
      description: 'Order or perform clinical procedures', 
      modal: 'procedure' 
    }
  ];
  
  // Open a specific modal
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };
  
  // Close the active modal
  const closeModal = () => {
    setActiveModal(null);
  };
  
  // Render the appropriate modal based on activeModal
  const renderModal = () => {
    switch (activeModal) {
      case 'medication':
        return <MedicationModal onClose={closeModal} />;
      case 'lab':
        return <LabOrderModal onClose={closeModal} />;
      case 'fluid':
        return <IVFluidModal onClose={closeModal} />;
      case 'exam':
        return <ExamModal onClose={closeModal} />;
      case 'procedure':
        return <ProcedureModal onClose={closeModal} />;
      default:
        return null;
    }
  };
  
  // Render action button
  const renderActionButton = (action) => {
    return (
      <button
        key={action.id}
        className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
        onClick={() => openModal(action.modal)}
      >
        <div className="text-2xl mb-2">{action.icon}</div>
        <h3 className="font-medium text-blue-800">{action.label}</h3>
        <p className="text-xs text-gray-600 mt-1 text-center">{action.description}</p>
      </button>
    );
  };
  
  return (
    <div className="actions-panel bg-gray-50 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Clinical Actions</h2>
        <div className="text-sm text-gray-600">
          Score: {score}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actionCategories.map(renderActionButton)}
      </div>
      
      {/* Reminder about action scoring */}
      <div className="mt-4 text-xs text-gray-500 italic">
        Note: Each action costs 1 point. Use clinical judgment to minimize unnecessary interventions.
      </div>
      
      {/* Modal container */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {renderModal()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPanel;
