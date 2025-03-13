// src/components/modals/LabOrderModal.jsx
import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';

const LabOrderModal = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  
  const orderLab = useGameStore(state => state.orderLab);
  const orderDiagnostic = useGameStore(state => state.orderDiagnostic);
  const isLoading = useGameStore(state => state.isLoading);
  
  // Lab categories
  const labCategories = [
    { id: 'basic', name: 'Basic / Chemistry' },
    { id: 'renal', name: 'Renal Function' },
    { id: 'cbc', name: 'Hematology' },
    { id: 'coags', name: 'Coagulation' },
    { id: 'urinalysis', name: 'Urinalysis' },
    { id: 'abg', name: 'Blood Gas' },
    { id: 'imaging', name: 'Imaging' },
    { id: 'other', name: 'Other Diagnostics' },
  ];
  
  // Lab tests by category
  const labTests = {
    basic: [
      { id: 'bmp', name: 'Basic Metabolic Panel', description: 'Na, K, Cl, CO2, BUN, Cr, Glucose, Ca' },
      { id: 'cmp', name: 'Comprehensive Metabolic Panel', description: 'BMP + liver function tests + albumin + total protein' },
      { id: 'lft', name: 'Liver Function Tests', description: 'AST, ALT, ALP, bilirubin, albumin, total protein' },
      { id: 'sodium', name: 'Sodium', description: 'Serum sodium level' },
      { id: 'potassium', name: 'Potassium', description: 'Serum potassium level' },
      { id: 'chloride', name: 'Chloride', description: 'Serum chloride level' },
      { id: 'bicarbonate', name: 'Bicarbonate', description: 'Serum bicarbonate (CO2) level' },
      { id: 'calcium', name: 'Calcium', description: 'Total serum calcium level' },
      { id: 'ionized_calcium', name: 'Ionized Calcium', description: 'Ionized calcium level' },
      { id: 'magnesium', name: 'Magnesium', description: 'Serum magnesium level' },
      { id: 'phosphorus', name: 'Phosphorus', description: 'Serum phosphorus level' },
      { id: 'glucose', name: 'Glucose', description: 'Serum glucose level' },
    ],
    renal: [
      { id: 'bun', name: 'BUN', description: 'Blood urea nitrogen' },
      { id: 'creatinine', name: 'Creatinine', description: 'Serum creatinine level' },
      { id: 'bun_cr_ratio', name: 'BUN/Creatinine Ratio', description: 'BUN to creatinine ratio' },
      { id: 'egfr', name: 'eGFR', description: 'Estimated glomerular filtration rate' },
      { id: 'cystatin_c', name: 'Cystatin C', description: 'Marker of kidney function' },
      { id: 'uric_acid', name: 'Uric Acid', description: 'Serum uric acid level' },
      { id: 'osmolality_serum', name: 'Serum Osmolality', description: 'Serum osmolality measurement' },
      { id: 'urine_electrolytes', name: 'Urine Electrolytes', description: 'Na, K, Cl in urine' },
      { id: 'urine_creatinine', name: 'Urine Creatinine', description: 'Creatinine level in urine' },
      { id: 'creatinine_clearance', name: 'Creatinine Clearance', description: '24-hour urine creatinine clearance' },
      { id: 'protein_creatinine_ratio', name: 'Protein/Creatinine Ratio', description: 'Urine protein to creatinine ratio' },
      { id: 'albumin_creatinine_ratio', name: 'Albumin/Creatinine Ratio', description: 'Urine albumin to creatinine ratio' },
    ],
    cbc: [
      { id: 'cbc', name: 'Complete Blood Count', description: 'Full blood count with differential' },
      { id: 'hemoglobin', name: 'Hemoglobin', description: 'Hemoglobin level' },
      { id: 'hematocrit', name: 'Hematocrit', description: 'Hematocrit percentage' },
      { id: 'wbc', name: 'White Blood Cells', description: 'White blood cell count' },
      { id: 'platelet', name: 'Platelets', description: 'Platelet count' },
    ],
    coags: [
      { id: 'pt_inr', name: 'PT/INR', description: 'Prothrombin time and international normalized ratio' },
      { id: 'ptt', name: 'PTT', description: 'Partial thromboplastin time' },
      { id: 'fibrinogen', name: 'Fibrinogen', description: 'Fibrinogen level' },
      { id: 'd_dimer', name: 'D-dimer', description: 'D-dimer level' },
    ],
    urinalysis: [
      { id: 'urinalysis', name: 'Urinalysis', description: 'Complete urinalysis with microscopic examination' },
      { id: 'urine_culture', name: 'Urine Culture', description: 'Culture for bacterial growth' },
      { id: 'urine_sodium', name: 'Urine Sodium', description: 'Sodium level in urine' },
      { id: 'urine_potassium', name: 'Urine Potassium', description: 'Potassium level in urine' },
      { id: 'urine_creatinine', name: 'Urine Creatinine', description: 'Creatinine level in urine' },
      { id: 'urine_protein', name: 'Urine Protein', description: 'Protein level in urine' },
      { id: 'urine_osmolality', name: 'Urine Osmolality', description: 'Urine osmolality measurement' },
    ],
    abg: [
      { id: 'abg', name: 'Arterial Blood Gas', description: 'Complete ABG with pH, PaO2, PaCO2, HCO3' },
      { id: 'vbg', name: 'Venous Blood Gas', description: 'Venous blood gas analysis' },
      { id: 'lactate', name: 'Lactate', description: 'Blood lactate level' },
    ],
    imaging: [
      { id: 'cxr', name: 'Chest X-Ray', description: 'Radiograph of the chest' },
      { id: 'kub', name: 'KUB', description: 'X-ray of kidneys, ureters, bladder' },
      { id: 'us_renal', name: 'Renal Ultrasound', description: 'Ultrasound of kidneys and urinary tract' },
      { id: 'ct_abdomen', name: 'CT Abdomen/Pelvis', description: 'CT scan of abdomen and pelvis' },
      { id: 'mri_renal', name: 'MRI Kidneys', description: 'MRI of kidneys' },
      { id: 'renal_doppler', name: 'Renal Doppler Ultrasound', description: 'Doppler ultrasound of renal vessels' },
    ],
    other: [
      { id: 'ecg', name: 'ECG', description: 'Electrocardiogram' },
      { id: 'renal_biopsy', name: 'Renal Biopsy', description: 'Kidney tissue sample for pathological examination' },
      { id: 'bladder_scan', name: 'Bladder Scan', description: 'Ultrasound measurement of bladder volume' },
      { id: 'dialysis_cath_check', name: 'Dialysis Catheter Check', description: 'Evaluation of dialysis catheter function' },
    ],
  };
  
  // Filter tests based on search query
  const filteredTests = searchQuery
    ? Object.values(labTests).flat().filter(test => 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        test.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : labTests[selectedCategory] || [];
  
  // Handle ordering a lab test
  const handleOrderTest = async () => {
    if (!selectedTest) return;
    
    // Determine if it's a regular lab or a diagnostic
    if (['imaging', 'other'].includes(selectedCategory)) {
      await orderDiagnostic({
        name: selectedTest.name,
        type: selectedCategory
      });
    } else {
      await orderLab({
        name: selectedTest.name,
        category: selectedCategory,
        id: selectedTest.id
      });
    }
    
    onClose();
  };
  
  return (
    <div className="lab-order-modal">
      {/* Modal header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Order Lab Tests & Diagnostics</h2>
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
        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for tests by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button 
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Category tabs (hidden during search) */}
        {!searchQuery && (
          <div className="mb-4 border-b border-gray-200">
            <div className="flex overflow-x-auto pb-1">
              {labCategories.map(category => (
                <button
                  key={category.id}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                    selectedCategory === category.id 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTest(null);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Test list */}
        <div className="mb-4 max-h-96 overflow-y-auto">
          {filteredTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tests found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTests.map(test => (
                <div 
                  key={test.id}
                  className={`p-3 cursor-pointer ${
                    selectedTest && selectedTest.id === test.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTest(test)}
                >
                  <div className="font-medium text-gray-800">{test.name}</div>
                  <div className="text-sm text-gray-600">{test.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Order button */}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${
              selectedTest && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!selectedTest || isLoading}
            onClick={handleOrderTest}
          >
            {isLoading ? 'Processing...' : `Order ${selectedTest ? selectedTest.name : 'Test'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabOrderModal;
