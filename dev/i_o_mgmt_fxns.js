// Add these functions to the gameStore.js file

// Inside the useGameStore = create((set, get) => ({ ... definition, add these functions:

  // Record fluid input (oral, IV, etc.)
  recordInput: (input) => {
    const { io, gameTime } = get();
    
    // Create new input record
    const newInput = {
      id: Date.now(),
      type: input.type, // 'oral', 'iv', 'other'
      subtype: input.subtype, // e.g., 'water', 'NS', 'D5W', etc.
      value: input.value, // amount in mL
      timestamp: new Date(gameTime)
    };
    
    // Update current totals
    const updatedInputs = {
      ...io.inputs.current,
      [input.type]: io.inputs.current[input.type] + input.value,
      total: io.inputs.current.total + input.value
    };
    
    // If it's an IV input, update the IV details
    if (input.type === 'iv') {
      updatedInputs.ivDetails = [
        ...io.inputs.current.ivDetails,
        {
          type: input.subtype,
          amount: input.value,
          timestamp: new Date(gameTime)
        }
      ];
    }
    
    // Calculate new balances
    const last8hInputs = [...io.inputs.history, newInput]
      .filter(i => (gameTime - i.timestamp) <= 8 * 60 * 60 * 1000)
      .reduce((sum, i) => sum + i.value, 0);
      
    const last8hOutputs = io.outputs.history
      .filter(o => (gameTime - o.timestamp) <= 8 * 60 * 60 * 1000)
      .reduce((sum, o) => sum + o.value, 0);
      
    const last24hInputs = [...io.inputs.history, newInput]
      .filter(i => (gameTime - i.timestamp) <= 24 * 60 * 60 * 1000)
      .reduce((sum, i) => sum + i.value, 0);
      
    const last24hOutputs = io.outputs.history
      .filter(o => (gameTime - o.timestamp) <= 24 * 60 * 60 * 1000)
      .reduce((sum, o) => sum + o.value, 0);
    
    const totalInputs = [...io.inputs.history, newInput]
      .reduce((sum, i) => sum + i.value, 0);
      
    const totalOutputs = io.outputs.history
      .reduce((sum, o) => sum + o.value, 0);
    
    // Update state
    set({
      io: {
        inputs: {
          current: updatedInputs,
          history: [...io.inputs.history, newInput]
        },
        outputs: io.outputs, // No change to outputs
        balance: {
          shift: last8hInputs - last8hOutputs,
          h24: last24hInputs - last24hOutputs,
          cumulative: totalInputs - totalOutputs
        }
      }
    });
    
    // Add nurse message for significant inputs
    if (input.value >= 500) {
      set(state => ({
        nurseChat: [...state.nurseChat, {
          sender: "nurse",
          message: `Recorded ${input.value} mL ${input.type === 'iv' ? input.subtype + ' IV' : input.type} input.`,
          timestamp: new Date(gameTime)
        }]
      }));
    }
    
    return {
      newInput,
      currentBalance: totalInputs - totalOutputs
    };
  },
  
  // Record fluid output (urine, emesis, etc.)
  recordOutput: (output) => {
    const { io, gameTime, patient } = get();
    
    // Create new output record
    const newOutput = {
      id: Date.now(),
      type: output.type, // 'urine', 'emesis', 'drain', 'other'
      value: output.value, // amount in mL
      timestamp: new Date(gameTime),
      properties: output.properties || {} // e.g., color, clarity for urine
    };
    
    // Update current totals
    const updatedOutputs = {
      ...io.outputs.current,
      [output.type]: io.outputs.current[output.type] + output.value,
      total: io.outputs.current.total + output.value
    };
    
    // Calculate new balances
    const last8hOutputs = [...io.outputs.history, newOutput]
      .filter(o => (gameTime - o.timestamp) <= 8 * 60 * 60 * 1000)
      .reduce((sum, o) => sum + o.value, 0);
      
    const last8hInputs = io.inputs.history
      .filter(i => (gameTime - i.timestamp) <= 8 * 60 * 60 * 1000)
      .reduce((sum, i) => sum + i.value, 0);
      
    const last24hOutputs = [...io.outputs.history, newOutput]
      .filter(o => (gameTime - o.timestamp) <= 24 * 60 * 60 * 1000)
      .reduce((sum, o) => sum + o.value, 0);
      
    const last24hInputs = io.inputs.history
      .filter(i => (gameTime - i.timestamp) <= 24 * 60 * 60 * 1000)
      .reduce((sum, i) => sum + i.value, 0);
    
    const totalOutputs = [...io.outputs.history, newOutput]
      .reduce((sum, o) => sum + o.value, 0);
      
    const totalInputs = io.inputs.history
      .reduce((sum, i) => sum + i.value, 0);
    
    // Update state
    set({
      io: {
        inputs: io.inputs, // No change to inputs
        outputs: {
          current: updatedOutputs,
          history: [...io.outputs.history, newOutput]
        },
        balance: {
          shift: last8hInputs - last8hOutputs,
          h24: last24hInputs - last24hOutputs,
          cumulative: totalInputs - totalOutputs
        }
      }
    });
    
    // Calculate urine output per kg (if urine and we have enough data)
    let nurseMessage = `Recorded ${output.value} mL ${output.type} output.`;
    
    if (output.type === 'urine' && patient.demographics.weight) {
      // Calculate hourly urine output for the last 4 hours
      const last4hUrine = [...io.outputs.history, newOutput]
        .filter(o => o.type === 'urine' && (gameTime - o.timestamp) <= 4 * 60 * 60 * 1000)
        .reduce((sum, o) => sum + o.value, 0);
      
      const hourlyUrinePerKg = (last4hUrine / 4) / patient.demographics.weight;
      
      // Add warning for low urine output
      if (hourlyUrinePerKg < 0.5) {
        nurseMessage += ` Urine output is ${hourlyUrinePerKg.toFixed(1)} mL/kg/hr over the last 4 hours, which is concerning for oliguria.`;
      }
    }
    
    // Add nurse message
    set(state => ({
      nurseChat: [...state.nurseChat, {
        sender: "nurse",
        message: nurseMessage,
        timestamp: new Date(gameTime)
      }]
    }));
    
    return {
      newOutput,
      currentBalance: totalInputs - totalOutputs
    };
  },
  
  // Add a continuous IV fluid
  startContinuousIV: async (fluid) => {
    set({ isLoading: true });
    
    try {
      const { interventions, gameTime, patient } = get();
      
      // Create a new intervention record
      const newIntervention = {
        id: Date.now(),
        name: fluid.name,
        type: 'fluid',
        dosage: `${fluid.rate} mL/hr`,
        route: 'IV',
        rate: fluid.rate, // mL/hr
        startTime: new Date(gameTime),
        isActive: true,
        endTime: fluid.duration 
          ? new Date(gameTime.getTime() + fluid.duration * 60000) 
          : null,
      };
      
      // Prepare prompt for AI to evaluate this fluid choice
      const prompt = `A nephrology patient with the following profile has started a new IV fluid.
        Please provide the expected clinical effects.
        
        Patient:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}, ${patient.demographics.weight}kg
        Clinical context: ${patient.clinicalContext}
        
        New IV fluid:
        ${fluid.name} at ${fluid.rate} mL/hr
        
        Assess whether this fluid is appropriate for the patient's condition and
        describe the expected effects on:
        1. Volume status
        2. Electrolyte balance
        3. Renal function
        
        Respond with an assessment in JSON format:
        {
          "appropriateness": "appropriate" or "concerning" or "inappropriate",
          "rationale": "clinical reasoning for your assessment",
          "expectedEffects": {
            "volumeStatus": "description",
            "electrolytes": "description",
            "renalFunction": "description"
          },
          "recommendations": "any recommendations if inappropriate"
        }`;
      
      // Call AI API for assessment
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const assessment = JSON.parse(response.choices[0].message.content);
      
      // Add intervention to the list
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        interventions: [...state.interventions, newIntervention],
        score: state.score - 1, // -1 for each action taken
      }));
      
      // Add a nurse message about the IV
      let nurseMessage = `Started ${fluid.name} at ${fluid.rate} mL/hr.`;
      
      // Add assessment if concerning or inappropriate
      if (assessment.appropriateness !== 'appropriate') {
        nurseMessage += ` Note: ${assessment.rationale}`;
      }
      
      set(state => ({
        nurseChat: [...state.nurseChat, {
          sender: "nurse",
          message: nurseMessage,
          timestamp: new Date(gameTime)
        }]
      }));
      
      // Start recording cumulative inputs automatically
      const recordIVInput = (gameTimeElapsed) => {
        if (!get().interventions.find(i => i.id === newIntervention.id && i.isActive)) {
          return; // Stop if intervention is no longer active
        }
        
        // Calculate amount for this interval
        const hourFraction = gameTimeElapsed / 3600; // Convert seconds to hours
        const amount = fluid.rate * hourFraction; // mL for this interval
        
        if (amount > 0) {
          get().recordInput({
            type: 'iv',
            subtype: fluid.name,
            value: amount
          });
        }
        
        // Only continue if the intervention is still active
        if (get().interventions.find(i => i.id === newIntervention.id && i.isActive)) {
          // Schedule next update based on time scale
          setTimeout(() => {
            recordIVInput(300); // Record every 5 minutes of game time
          }, 300000 / get().timeScale); // Adjust for time scale
        }
      };
      
      // Start the recording cycle
      setTimeout(() => {
        recordIVInput(300); // First record after 5 minutes of game time
      }, 300000 / get().timeScale);
      
      return {
        intervention: newIntervention,
        assessment
      };
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to start IV fluid. Please try again." 
      });
      console.error("IV fluid error:", error);
      return null;
    }
  },
  
  // Stop a continuous IV fluid
  stopContinuousIV: (interventionId) => {
    const { interventions, gameTime } = get();
    
    // Find the intervention
    const intervention = interventions.find(i => i.id === interventionId);
    
    if (!intervention || !intervention.isActive) {
      return { success: false, message: "Intervention not found or already inactive" };
    }
    
    // Update the intervention
    const updatedInterventions = interventions.map(i => 
      i.id === interventionId 
        ? { ...i, isActive: false, endTime: new Date(gameTime) }
        : i
    );
    
    // Update state
    set({
      interventions: updatedInterventions
    });
    
    // Add a nurse message
    set(state => ({
      nurseChat: [...state.nurseChat, {
        sender: "nurse",
        message: `Stopped ${intervention.name} (was running at ${intervention.dosage}).`,
        timestamp: new Date(gameTime)
      }]
    }));
    
    return { 
      success: true, 
      message: `${intervention.name} stopped at ${new Date(gameTime).toLocaleTimeString()}`
    };
  },
  
  // Calculate urine studies (specific gravity, osmolality, etc.)
  calculateUrineStudies: async () => {
    set({ isLoading: true });
    
    try {
      const { patient, labs, io, gameTime } = get();
      
      // Get recent urine output data
      const recentUrine = io.outputs.history
        .filter(o => o.type === 'urine' && (gameTime - o.timestamp) <= 8 * 60 * 60 * 1000);
      
      if (recentUrine.length === 0) {
        set({ 
          isLoading: false,
          error: "No recent urine output recorded. Cannot calculate urine studies." 
        });
        return null;
      }
      
      // Prepare relevant lab data for context
      const serumSodium = labs.basic.sodium?.value || "unknown";
      const serumPotassium = labs.basic.potassium?.value || "unknown";
      const serumCreatinine = labs.renal.creatinine?.value || "unknown";
      const serumBUN = labs.renal.bun?.value || "unknown";
      const serumOsmolality = labs.renal.osmolality?.value || "unknown";
      
      // Prepare prompt for AI
      const prompt = `Calculate realistic urine studies for a nephrology patient with the following profile:
        
        Patient:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}, ${patient.demographics.weight}kg
        Clinical context: ${patient.clinicalContext}
        
        Relevant serum values:
        Sodium: ${serumSodium} ${labs.basic.sodium?.units || "mEq/L"}
        Potassium: ${serumPotassium} ${labs.basic.potassium?.units || "mEq/L"}
        Creatinine: ${serumCreatinine} ${labs.renal.creatinine?.units || "mg/dL"}
        BUN: ${serumBUN} ${labs.renal.bun?.units || "mg/dL"}
        Serum Osmolality: ${serumOsmolality} ${labs.renal.osmolality?.units || "mOsm/kg"}
        
        Urine output in last 8 hours: ${recentUrine.reduce((sum, o) => sum + o.value, 0)} mL
        
        Based on the patient's clinical context and lab values, provide realistic urine studies that would be consistent with the patient's condition.
        
        Respond with the urine studies in JSON format:
        {
          "urineSpecificGravity": number,
          "urineOsmolality": number,
          "urineNa": number,
          "urineK": number,
          "urineCl": number,
          "urineCr": number,
          "urineProtein": number,
          "feNa": number,
          "interpretation": "clinical interpretation of findings"
        }`;
      
      // Call AI API for urine studies
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const urineStudies = JSON.parse(response.choices[0].message.content);
      
      // Update labs structure with urine studies
      set(state => {
        // Create new lab history entries for each urine study
        const newLabHistory = [
          {
            name: 'urineSpecificGravity',
            category: 'urinalysis',
            value: urineStudies.urineSpecificGravity,
            units: '',
            referenceRange: '1.005-1.030',
            timestamp: new Date(gameTime)
          },
          {
            name: 'urineOsmolality',
            category: 'urinalysis',
            value: urineStudies.urineOsmolality,
            units: 'mOsm/kg',
            referenceRange: '300-900',
            timestamp: new Date(gameTime)
          },
          {
            name: 'urineNa',
            category: 'urinalysis',
            value: urineStudies.urineNa,
            units: 'mEq/L',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          {
            name: 'urineK',
            category: 'urinalysis',
            value: urineStudies.urineK,
            units: 'mEq/L',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          {
            name: 'urineCr',
            category: 'urinalysis',
            value: urineStudies.urineCr,
            units: 'mg/dL',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          {
            name: 'urineProtein',
            category: 'urinalysis',
            value: urineStudies.urineProtein,
            units: 'mg/dL',
            referenceRange: '<20',
            timestamp: new Date(gameTime)
          },
          {
            name: 'feNa',
            category: 'urinalysis',
            value: urineStudies.feNa,
            units: '%',
            referenceRange: '<1% (prerenal), >2% (intrinsic)',
            timestamp: new Date(gameTime)
          }
        ];
        
        // Update the urinalysis category
        const updatedUrinalysis = {
          urineSpecificGravity: {
            value: urineStudies.urineSpecificGravity,
            units: '',
            referenceRange: '1.005-1.030',
            timestamp: new Date(gameTime)
          },
          urineOsmolality: {
            value: urineStudies.urineOsmolality,
            units: 'mOsm/kg',
            referenceRange: '300-900',
            timestamp: new Date(gameTime)
          },
          urineNa: {
            value: urineStudies.urineNa,
            units: 'mEq/L',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          urineK: {
            value: urineStudies.urineK,
            units: 'mEq/L',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          urineCr: {
            value: urineStudies.urineCr,
            units: 'mg/dL',
            referenceRange: 'varies',
            timestamp: new Date(gameTime)
          },
          urineProtein: {
            value: urineStudies.urineProtein,
            units: 'mg/dL',
            referenceRange: '<20',
            timestamp: new Date(gameTime)
          },
          feNa: {
            value: urineStudies.feNa,
            units: '%',
            referenceRange: '<1% (prerenal), >2% (intrinsic)',
            timestamp: new Date(gameTime)
          }
        };
        
        return {
          isLoading: false,
          apiCalls: state.apiCalls + 1,
          apiCost: Number((state.apiCost + 0.01).toFixed(2)),
          labs: {
            ...state.labs,
            urinalysis: updatedUrinalysis,
            history: [...state.labs.history, ...newLabHistory]
          },
          results: [...state.results, {
            type: "lab",
            category: "urinalysis",
            name: "Urine Studies",
            ordered: new Date(gameTime),
            pending: false,
            resultData: urineStudies
          }],
          nurseChat: [...state.nurseChat, {
            sender: "nurse",
            message: `Urine studies completed. FENa: ${urineStudies.feNa.toFixed(2)}%. ${urineStudies.interpretation}`,
            timestamp: new Date(gameTime)
          }]
        };
      });
      
      return urineStudies;
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to calculate urine studies. Please try again." 
      });
      console.error("Urine studies error:", error);
      return null;
    }
  }
  
  // More functions as needed...

// Closing parentheses and export statement would go here
