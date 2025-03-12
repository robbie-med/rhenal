// src/state/gameStore.js
import { create } from 'zustand';
import { fetchAIResponse } from '../services/aiService';

// Utility function to calculate MAP (Mean Arterial Pressure)
const calculateMAP = (systolic, diastolic) => {
  return Math.round(diastolic + (systolic - diastolic) / 3);
};

// Central game state store using Zustand
export const useGameStore = create((set, get) => ({
  // Game meta state
  isLoading: false,
  error: null,
  gameTime: new Date(),
  timeScale: 1, // Real-time by default (1:1 ratio)
  apiCalls: 0,
  apiCost: 0,
  score: 0,
  
  // Patient data
  patient: {
    demographics: {
      name: "",
      age: 0,
      gender: "",
      weight: 0, // kg
      height: 0, // cm
    },
    clinicalContext: "",
    location: "", // ED, inpatient, post-op
    history: "",
    comorbidities: [],
    allergies: [],
    baselineCreatinine: null, // Baseline creatinine if known
  },
  
  // Vital signs with history for trending
  vitals: {
    current: {
      hr: 0,
      sbp: 0,
      dbp: 0,
      map: 0,
      rr: 0,
      temp: 0,
      spo2: 0,
    },
    history: [], // Array of timestamped vital readings
  },
  
  // Lab results, organized by category with history
  labs: {
    basic: {}, // Basic labs with current value
    renal: {}, // Renal-specific labs with current value
    cbc: {}, // Complete blood count labs
    coags: {}, // Coagulation studies
    urinalysis: {}, // Urinalysis results
    abg: {}, // Arterial blood gas
    imaging: {}, // Imaging reports
    other: {}, // Other diagnostic results
    history: [] // Complete history of all labs with timestamps for trending
  },
  
  // I/O tracking
  io: {
    // Inputs tracking
    inputs: {
      current: {
        oral: 0,
        iv: 0, // Total IV fluid
        ivDetails: [], // Breakdown of IV fluids by type
        other: 0,
        total: 0
      },
      history: [] // Timestamped input records
    },
    // Outputs tracking
    outputs: {
      current: {
        urine: 0,
        emesis: 0,
        drain: 0,
        other: 0,
        total: 0
      },
      history: [] // Timestamped output records
    },
    // Balance calculations
    balance: {
      shift: 0, // 8-hour balance
      h24: 0, // 24-hour balance
      cumulative: 0 // Total since admission
    }
  },
  
  // Diagnostic results (non-lab)
  results: [],
  
  // Active interventions (like a MAR)
  interventions: [],
  
  // Communication logs
  attendingChat: [],
  nurseChat: [],
  
  // Initialize the game with a new patient scenario
  initializeGame: async (scenarioType = "random") => {
    set({ isLoading: true, error: null });
    
    try {
      const prompt = `Generate a detailed nephrology patient case with the following characteristics:
        1. Location: ${scenarioType === "random" ? "Choose from ED, inpatient, or post-op" : scenarioType}
        2. Include: Full demographics, detailed history, current vital signs, relevant comorbidities
        3. Focus on a realistic nephrology case that would challenge a medical resident
        4. Provide initial vital signs within realistic parameters
        5. Include initial renal labs (creatinine, BUN, etc.)
        6. Include initial electrolytes
        7. Format the response as a JSON object with the following structure:
           {
             "demographics": {"name", "age", "gender", "weight", "height"},
             "location": "",
             "clinicalContext": "",
             "history": "",
             "comorbidities": [],
             "allergies": [],
             "baselineCreatinine": number or null,
             "vitals": {"hr", "sbp", "dbp", "rr", "temp", "spo2"},
             "labs": {
               "basic": {
                 "sodium": {"value": number, "units": "mEq/L", "referenceRange": "135-145"},
                 "potassium": {"value": number, "units": "mEq/L", "referenceRange": "3.5-5.0"},
                 "chloride": {"value": number, "units": "mEq/L", "referenceRange": "98-107"},
                 "bicarbonate": {"value": number, "units": "mEq/L", "referenceRange": "22-29"},
                 "glucose": {"value": number, "units": "mg/dL", "referenceRange": "70-100"}
               },
               "renal": {
                 "bun": {"value": number, "units": "mg/dL", "referenceRange": "7-20"},
                 "creatinine": {"value": number, "units": "mg/dL", "referenceRange": "0.7-1.3"},
                 "egfr": {"value": number, "units": "mL/min/1.73m²", "referenceRange": ">60"}
               }
             }
           }`;
      
      // Call AI API to generate patient
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response to extract the JSON data
      const patientData = JSON.parse(response.choices[0].message.content);
      
      // Calculate MAP from systolic and diastolic BP
      const map = calculateMAP(patientData.vitals.sbp, patientData.vitals.dbp);
      
      // Get current timestamp
      const now = new Date();
      
      // Prepare initial lab history
      const labHistory = [];
      
      // Process basic labs
      Object.entries(patientData.labs.basic).forEach(([name, data]) => {
        labHistory.push({
          name,
          category: 'basic',
          value: data.value,
          units: data.units,
          referenceRange: data.referenceRange,
          timestamp: now
        });
      });
      
      // Process renal labs
      Object.entries(patientData.labs.renal).forEach(([name, data]) => {
        labHistory.push({
          name,
          category: 'renal',
          value: data.value,
          units: data.units,
          referenceRange: data.referenceRange,
          timestamp: now
        });
      });
      
      // Update the game state with the new patient data
      set({
        isLoading: false,
        apiCalls: get().apiCalls + 1,
        apiCost: Number((get().apiCost + 0.01).toFixed(2)),
        patient: {
          demographics: patientData.demographics,
          clinicalContext: patientData.clinicalContext,
          location: patientData.location,
          history: patientData.history,
          comorbidities: patientData.comorbidities,
          allergies: patientData.allergies || [],
          baselineCreatinine: patientData.baselineCreatinine || null,
        },
        vitals: {
          current: {
            ...patientData.vitals,
            map,
          },
          history: [{
            timestamp: now,
            ...patientData.vitals,
            map,
          }],
        },
        // Set up initial labs
        labs: {
          basic: patientData.labs.basic,
          renal: patientData.labs.renal,
          cbc: {},
          coags: {},
          urinalysis: {},
          abg: {},
          imaging: {},
          other: {},
          history: labHistory
        },
        // Initialize I/O tracking
        io: {
          inputs: {
            current: {
              oral: 0,
              iv: 0,
              ivDetails: [],
              other: 0,
              total: 0
            },
            history: []
          },
          outputs: {
            current: {
              urine: 0,
              emesis: 0,
              drain: 0,
              other: 0,
              total: 0
            },
            history: []
          },
          balance: {
            shift: 0,
            h24: 0,
            cumulative: 0
          }
        },
        // Add an initial message from the nurse
        nurseChat: [{
          sender: "nurse",
          message: `New patient arrived. ${patientData.demographics.name}, ${patientData.demographics.age}y ${patientData.demographics.gender[0]} with ${patientData.clinicalContext}.`,
          timestamp: now
        }],
      });
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to initialize patient scenario. Please try again." 
      });
      console.error("Patient initialization error:", error);
    }
  },
  
  // Update vital signs based on current interventions and disease progression
  updateVitals: async () => {
    const { vitals, interventions, gameTime, io, labs, timeScale } = get();
    
    // Only make API call if there are active interventions
    // or if it's been more than 30 game-minutes since the last update
    const lastVitalsUpdate = vitals.history[vitals.history.length - 1].timestamp;
    const gameMinutesSinceLastUpdate = (gameTime - lastVitalsUpdate) / (1000 * 60);
    
    if (interventions.length === 0 && gameMinutesSinceLastUpdate < 30) {
      // Minor random fluctuations if no interventions and recent update
      const currentVitals = vitals.current;
      const fluctuation = 0.05; // 5% random fluctuation
      
      const newVitals = {
        hr: Math.round(currentVitals.hr * (1 + (Math.random() * 2 - 1) * fluctuation)),
        sbp: Math.round(currentVitals.sbp * (1 + (Math.random() * 2 - 1) * fluctuation)),
        dbp: Math.round(currentVitals.dbp * (1 + (Math.random() * 2 - 1) * fluctuation)),
        rr: Math.round(currentVitals.rr * (1 + (Math.random() * 2 - 1) * fluctuation)),
        temp: Number((currentVitals.temp * (1 + (Math.random() * 2 - 1) * fluctuation * 0.5)).toFixed(1)),
        spo2: Math.min(100, Math.round(currentVitals.spo2 * (1 + (Math.random() * 2 - 1) * fluctuation * 0.2))),
      };
      
      newVitals.map = calculateMAP(newVitals.sbp, newVitals.dbp);
      
      set({
        vitals: {
          current: newVitals,
          history: [...vitals.history, { ...newVitals, timestamp: new Date(gameTime) }]
        }
      });
      
      return;
    }
    
    // Make AI call for significant updates
    set({ isLoading: true });
    
    try {
      // Compile relevant patient context for the AI
      // This reduces token usage by only sending pertinent information
      
      // Format active interventions for the AI
      const activeInterventionsText = interventions
        .filter(i => i.isActive)
        .map(i => `${i.name} (${i.dosage}) started at ${i.startTime.toLocaleTimeString()}, current duration: ${
          Math.round((gameTime - i.startTime) / (1000 * 60))} minutes`)
        .join("\n");
      
      // Get recent I/O data
      const recentIO = {
        last8h: {
          input: io.inputs.history
            .filter(i => (gameTime - i.timestamp) <= 8 * 60 * 60 * 1000)
            .reduce((sum, i) => sum + i.value, 0),
          output: io.outputs.history
            .filter(o => (gameTime - o.timestamp) <= 8 * 60 * 60 * 1000)
            .reduce((sum, o) => sum + o.value, 0)
        }
      };
      
      // Get relevant lab data that might affect vitals
      const relevantLabsText = [];
      
      // Include latest electrolytes
      const latestSodium = labs.basic.sodium?.value;
      const latestPotassium = labs.basic.potassium?.value;
      if (latestSodium) relevantLabsText.push(`Sodium: ${latestSodium} ${labs.basic.sodium.units}`);
      if (latestPotassium) relevantLabsText.push(`Potassium: ${latestPotassium} ${labs.basic.potassium.units}`);
      
      // Include latest hemoglobin/hematocrit
      const latestHgb = labs.cbc.hemoglobin?.value;
      if (latestHgb) relevantLabsText.push(`Hemoglobin: ${latestHgb} ${labs.cbc.hemoglobin.units}`);
      
      // Include latest renal function tests
      const latestCreatinine = labs.renal.creatinine?.value;
      const latestBUN = labs.renal.bun?.value;
      if (latestCreatinine) relevantLabsText.push(`Creatinine: ${latestCreatinine} ${labs.renal.creatinine.units}`);
      if (latestBUN) relevantLabsText.push(`BUN: ${latestBUN} ${labs.renal.bun.units}`);
      
      const prompt = `Given the following patient with current vital signs, active interventions, and clinical data, 
        provide updated vital signs that accurately reflect the physiological response to these interventions 
        and the natural progression of the patient's condition.
        
        Current vital signs:
        HR: ${vitals.current.hr}
        BP: ${vitals.current.sbp}/${vitals.current.dbp}
        MAP: ${vitals.current.map}
        RR: ${vitals.current.rr}
        Temp: ${vitals.current.temp}
        SpO2: ${vitals.current.spo2}
        
        Active interventions:
        ${activeInterventionsText || "None"}
        
        Recent I/O (past 8 hours):
        Input: ${recentIO.last8h.input} mL
        Output: ${recentIO.last8h.output} mL
        Balance: ${recentIO.last8h.input - recentIO.last8h.output} mL
        
        Relevant lab values:
        ${relevantLabsText.length > 0 ? relevantLabsText.join('\n') : 'No recent labs available'}
        
        Time elapsed since last major update: ${gameMinutesSinceLastUpdate.toFixed(0)} minutes
        
        Patient clinical context:
        ${get().patient.clinicalContext}
        
        Respond with updated vital signs in JSON format:
        {
          "hr": number,
          "sbp": number,
          "dbp": number,
          "rr": number, 
          "temp": number,
          "spo2": number,
          "assessment": "brief clinical assessment explaining changes"
        }`;
      
      // Call AI API for updated vitals
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const updatedVitals = JSON.parse(response.choices[0].message.content);
      
      // Calculate MAP
      updatedVitals.map = calculateMAP(updatedVitals.sbp, updatedVitals.dbp);
      
      // Add a nursing note if there's a significant change
      const significantChange = 
        Math.abs(updatedVitals.hr - vitals.current.hr) > 15 ||
        Math.abs(updatedVitals.sbp - vitals.current.sbp) > 20 ||
        Math.abs(updatedVitals.dbp - vitals.current.dbp) > 15 ||
        Math.abs(updatedVitals.rr - vitals.current.rr) > 5 ||
        Math.abs(updatedVitals.temp - vitals.current.temp) > 0.5 ||
        Math.abs(updatedVitals.spo2 - vitals.current.spo2) > 5;
      
      // Update state with new vitals and possible nurse message
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        vitals: {
          current: {
            hr: updatedVitals.hr,
            sbp: updatedVitals.sbp,
            dbp: updatedVitals.dbp,
            map: updatedVitals.map,
            rr: updatedVitals.rr,
            temp: updatedVitals.temp,
            spo2: updatedVitals.spo2,
          },
          history: [...state.vitals.history, { 
            ...updatedVitals, 
            timestamp: new Date(gameTime) 
          }]
        },
        nurseChat: significantChange 
          ? [...state.nurseChat, {
              sender: "nurse",
              message: `Vital signs update: HR ${updatedVitals.hr}, BP ${updatedVitals.sbp}/${updatedVitals.dbp}, RR ${updatedVitals.rr}. ${updatedVitals.assessment}`,
              timestamp: new Date(gameTime)
            }]
          : state.nurseChat
      }));
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to update vital signs. Using estimated values." 
      });
      console.error("Vitals update error:", error);
      
      // Fallback to simple estimation if API fails
      get().estimateVitals();
    }
  },
  
  // Fallback function for vitals updates if API fails
  estimateVitals: () => {
    // Simple fallback estimation logic
    // This would be enhanced based on your specific requirements
    const { vitals, gameTime } = get();
    const currentVitals = vitals.current;
    
    const estimatedVitals = {
      hr: Math.round(currentVitals.hr * (1 + (Math.random() * 0.1 - 0.05))),
      sbp: Math.round(currentVitals.sbp * (1 + (Math.random() * 0.1 - 0.05))),
      dbp: Math.round(currentVitals.dbp * (1 + (Math.random() * 0.1 - 0.05))),
      rr: Math.round(currentVitals.rr * (1 + (Math.random() * 0.1 - 0.05))),
      temp: Number((currentVitals.temp * (1 + (Math.random() * 0.02 - 0.01))).toFixed(1)),
      spo2: Math.min(100, Math.round(currentVitals.spo2 * (1 + (Math.random() * 0.02 - 0.01)))),
    };
    
    estimatedVitals.map = calculateMAP(estimatedVitals.sbp, estimatedVitals.dbp);
    
    set({
      vitals: {
        current: estimatedVitals,
        history: [...vitals.history, { ...estimatedVitals, timestamp: new Date(gameTime) }]
      }
    });
  },
  
  // Perform a medical intervention (medication, fluid, etc.)
  performIntervention: async (intervention) => {
    set({ isLoading: true });
    
    try {
      const { patient, vitals, interventions, gameTime } = get();
      
      // Create a new intervention record
      const newIntervention = {
        id: Date.now(),
        name: intervention.name,
        type: intervention.type,
        dosage: intervention.dosage,
        route: intervention.route,
        startTime: new Date(gameTime),
        isActive: true,
        endTime: intervention.duration 
          ? new Date(gameTime.getTime() + intervention.duration * 60000) 
          : null,
      };
      
      // Prepare prompt for AI
      const prompt = `A nephrology patient with the following profile has received a new medical intervention.
        Please provide the expected immediate clinical effects and updated vital signs.
        
        Patient:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}, ${patient.weight}kg
        Clinical context: ${patient.clinicalContext}
        
        Current vital signs:
        HR: ${vitals.current.hr}
        BP: ${vitals.current.sbp}/${vitals.current.dbp}
        MAP: ${vitals.current.map}
        RR: ${vitals.current.rr}
        Temp: ${vitals.current.temp}
        SpO2: ${vitals.current.spo2}
        
        New intervention:
        ${intervention.name} ${intervention.dosage} ${intervention.route}
        
        Active interventions:
        ${interventions.map(i => `${i.name} (${i.dosage}) - started ${Math.round((gameTime - i.startTime) / (1000 * 60))} minutes ago`).join("\n")}
        
        Respond with the expected clinical effects and updated vital signs in JSON format:
        {
          "clinicalEffects": "description of expected effects",
          "timeToEffect": number (minutes until effects begin),
          "vitals": {
            "hr": number,
            "sbp": number,
            "dbp": number,
            "rr": number,
            "temp": number,
            "spo2": number
          }
        }`;
      
      // Call AI API for intervention response
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Add intervention to the list
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        interventions: [...state.interventions, newIntervention],
        results: [...state.results, {
          type: "intervention",
          name: intervention.name,
          timestamp: new Date(gameTime),
          details: result.clinicalEffects,
          timeToEffect: result.timeToEffect
        }],
        score: state.score - 1, // -1 for each action taken
      }));
      
      // If there's an immediate effect, update vitals
      if (result.timeToEffect === 0) {
        const newVitals = {
          ...result.vitals,
          map: calculateMAP(result.vitals.sbp, result.vitals.dbp)
        };
        
        set(state => ({
          vitals: {
            current: newVitals,
            history: [...state.vitals.history, { 
              ...newVitals, 
              timestamp: new Date(gameTime) 
            }]
          }
        }));
      }
      
      // Add a nurse message about the intervention
      set(state => ({
        nurseChat: [...state.nurseChat, {
          sender: "nurse",
          message: `Administered ${intervention.name} ${intervention.dosage} ${intervention.route}.`,
          timestamp: new Date(gameTime)
        }]
      }));
      
      return result;
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to process the intervention. Please try again." 
      });
      console.error("Intervention error:", error);
      return null;
    }
  },
  
  // Order a lab test or diagnostic procedure
  orderLab: async (labOrder) => {
    set({ isLoading: true });
    
    try {
      const { patient, labs, vitals, interventions, io, gameTime } = get();
      
      // Determine what historical context to send for this lab type
      // This helps reduce token usage by only sending relevant history
      const getRelevantHistory = () => {
        // Get the most recent labs for context (max 3 previous values)
        const relevantLabHistory = labs.history
          .filter(lab => lab.category === labOrder.category)
          .slice(-3)
          .map(lab => `${lab.name}: ${lab.value} ${lab.units} (${lab.timestamp.toLocaleString()})`);
        
        // For renal labs, include I/O data
        let ioContext = '';
        if (labOrder.category === 'renal' || labOrder.name.includes('creatinine') || labOrder.name.includes('BUN')) {
          const last24hUrine = io.outputs.history
            .filter(o => o.type === 'urine' && (gameTime - o.timestamp) <= 24 * 60 * 60 * 1000)
            .reduce((sum, o) => sum + o.value, 0);
            
          ioContext = `
          24h urine output: ${last24hUrine} mL
          Current I/O balance: ${io.balance.h24} mL (24h), ${io.balance.cumulative} mL (cumulative)`;
        }
        
        // For electrolytes, include recent fluid interventions
        let fluidContext = '';
        if (labOrder.category === 'basic' || labOrder.name.includes('sodium') || labOrder.name.includes('potassium')) {
          const recentFluids = interventions
            .filter(i => i.type === 'fluid' && (gameTime - i.startTime) <= 24 * 60 * 60 * 1000)
            .map(i => `${i.name} (${i.dosage}): started ${i.startTime.toLocaleString()}`);
            
          if (recentFluids.length > 0) {
            fluidContext = `
            Recent fluid interventions:
            ${recentFluids.join('\n')}`;
          }
        }
        
        return relevantLabHistory.join('\n') + ioContext + fluidContext;
      };
      
      // Prepare prompt for AI with only relevant historical context
      const prompt = `A nephrology patient needs results for: ${labOrder.name} (${labOrder.category} category).
        
        Patient:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}, ${patient.demographics.weight}kg
        Clinical context: ${patient.clinicalContext}
        Location: ${patient.location}
        
        Current vital signs:
        HR: ${vitals.current.hr}
        BP: ${vitals.current.sbp}/${vitals.current.dbp}
        MAP: ${vitals.current.map}
        RR: ${vitals.current.rr}
        Temp: ${vitals.current.temp}
        SpO2: ${vitals.current.spo2}
        
        Relevant history:
        ${getRelevantHistory()}
        
        Based on the patient's condition, provide realistic results for this lab test.
        Make sure the results are consistent with the patient's clinical context and reflect
        renal pathophysiology accurately. If this is a follow-up test, ensure the values
        show realistic progression from previous results.
        
        Format the response as a JSON object:
        {
          "name": "${labOrder.name}",
          "category": "${labOrder.category}",
          "value": number or string depending on test type,
          "units": string,
          "referenceRange": string,
          "interpretation": "Brief clinical interpretation of findings",
          "timeToResult": number, // Realistic time in minutes until results would be available
          "isCritical": boolean, // Whether this is a critical value requiring immediate notification
          "relatedValues": {} // Any related measurements from the same sample (e.g., other electrolytes)
        }`;
      
      // Call AI API for lab results
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Add lab order to pending results
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        results: [...state.results, {
          type: "lab",
          category: labOrder.category,
          name: labOrder.name,
          ordered: new Date(gameTime),
          pending: true,
          estimatedTime: result.timeToResult,
          resultData: result
        }],
        score: state.score - 1, // -1 for each action taken
      }));
      
      // Simulate the time delay for results to become available
      setTimeout(() => {
        // When results are ready, update both the results list and the labs structure
        set(state => {
          // Create the timestamp for when results became available
          const resultTimestamp = new Date(state.gameTime);
          
          // Update the results array (mark as not pending)
          const updatedResults = state.results.map(r => 
            r.type === "lab" && 
            r.name === labOrder.name && 
            r.ordered.getTime() === new Date(gameTime).getTime()
              ? { ...r, pending: false }
              : r
          );
          
          // Update the appropriate lab category with the new value
          const updatedLabs = {...state.labs};
          
          // Update the current value in the appropriate category
          updatedLabs[result.category] = {
            ...updatedLabs[result.category],
            [result.name]: {
              value: result.value,
              units: result.units,
              referenceRange: result.referenceRange,
              timestamp: resultTimestamp
            }
          };
          
          // Also add any related values
          if (result.relatedValues) {
            Object.entries(result.relatedValues).forEach(([name, data]) => {
              updatedLabs[result.category] = {
                ...updatedLabs[result.category],
                [name]: {
                  value: data.value,
                  units: data.units,
                  referenceRange: data.referenceRange,
                  timestamp: resultTimestamp
                }
              };
            });
          }
          
          // Add to the history array for trending
          updatedLabs.history = [
            ...updatedLabs.history,
            {
              name: result.name,
              category: result.category,
              value: result.value,
              units: result.units,
              referenceRange: result.referenceRange,
              interpretation: result.interpretation,
              timestamp: resultTimestamp,
              isCritical: result.isCritical || false
            }
          ];
          
          // If there are related values, add those to history too
          if (result.relatedValues) {
            Object.entries(result.relatedValues).forEach(([name, data]) => {
              updatedLabs.history.push({
                name: name,
                category: result.category,
                value: data.value,
                units: data.units,
                referenceRange: data.referenceRange,
                timestamp: resultTimestamp,
                isCritical: data.isCritical || false
              });
            });
          }
          
          // Create appropriate nurse message based on results
          let nurseMessage = `Results for ${labOrder.name} are now available.`;
          
          // Add critical value alert
          if (result.isCritical) {
            nurseMessage = `⚠️ CRITICAL RESULT: ${labOrder.name} is ${result.value} ${result.units}. ${result.interpretation}`;
          }
          
          return {
            results: updatedResults,
            labs: updatedLabs,
            nurseChat: [...state.nurseChat, {
              sender: "nurse",
              message: nurseMessage,
              timestamp: resultTimestamp
            }]
          };
        });
      }, result.timeToResult * 60000 / get().timeScale); // Adjust based on time scale
      
      return result;
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to order the lab test. Please try again." 
      });
      console.error("Lab order error:", error);
      return null;
    }
  },
  
  // Order a diagnostic procedure (imaging, etc.)
  orderDiagnostic: async (diagnostic) => {
    set({ isLoading: true });
    
    try {
      const { patient, results, gameTime } = get();
      
      // Prepare prompt for AI
      const prompt = `A nephrology patient with the following profile needs results for: ${diagnostic.name}.
        
        Patient:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}, ${patient.demographics.weight}kg
        Clinical context: ${patient.clinicalContext}
        
        Based on the patient's condition, provide realistic results for this diagnostic test.
        Make sure the results are consistent with the patient's clinical context and reflect
        renal pathophysiology accurately.
        
        For imaging or other diagnostics, provide a detailed report.
        
        Format the response as a JSON object:
        {
          "name": "${diagnostic.name}",
          "results": {}, // Detailed results appropriate for the test type
          "interpretation": "Brief clinical interpretation of findings",
          "timeToResult": number, // Realistic time in minutes until results would be available
          "keyFindings": [] // Array of key findings from the test
        }`;
      
      // Call AI API for diagnostic results
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Add diagnostic order to results
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        results: [...state.results, {
          type: "diagnostic",
          name: diagnostic.name,
          ordered: new Date(gameTime),
          pending: true,
          estimatedTime: result.timeToResult,
          resultData: result
        }],
        score: state.score - 1, // -1 for each action taken
      }));
      
      // Simulate the time delay for results to become available
      setTimeout(() => {
        set(state => ({
          // Find and update the pending diagnostic
          results: state.results.map(r => 
            r.type === "diagnostic" && 
            r.name === diagnostic.name && 
            r.ordered.getTime() === new Date(gameTime).getTime()
              ? { ...r, pending: false }
              : r
          ),
          // Add a nurse message about the results
          nurseChat: [...state.nurseChat, {
            sender: "nurse",
            message: `Results for ${diagnostic.name} are now available.`,
            timestamp: new Date(state.gameTime)
          }]
        }));
      }, result.timeToResult * 60000 / get().timeScale); // Adjust based on time scale
      
      return result;
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to order the diagnostic. Please try again." 
      });
      console.error("Diagnostic error:", error);
      return null;
    }
  },
  
  // Send a message to the attending physician and get feedback
  consultAttending: async (message) => {
    set({ isLoading: true });
    
    try {
      const { patient, vitals, results, interventions, gameTime, attendingChat } = get();
      
      // Format recent results for context
      const recentResultsText = results
        .filter(r => !r.pending)
        .slice(-5)
        .map(r => {
          if (r.type === "diagnostic") {
            return `${r.name}: ${r.resultData.interpretation}`;
          } else if (r.type === "intervention") {
            return `${r.name}: ${r.details}`;
          }
          return "";
        })
        .join("\n");
      
      // Prepare prompt for AI
      const prompt = `You are an attending nephrologist supervising a resident.
        The resident has sent you the following message about a patient:
        "${message}"
        
        Patient information:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}
        Clinical context: ${patient.clinicalContext}
        
        Current vital signs:
        HR: ${vitals.current.hr}
        BP: ${vitals.current.sbp}/${vitals.current.dbp}
        MAP: ${vitals.current.map}
        RR: ${vitals.current.rr}
        Temp: ${vitals.current.temp}
        SpO2: ${vitals.current.spo2}
        
        Recent results and interventions:
        ${recentResultsText}
        
        Active interventions:
        ${interventions.filter(i => i.isActive).map(i => i.name + " " + i.dosage).join(", ")}
        
        Previous conversation:
        ${attendingChat.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join("\n")}
        
        Respond as the attending nephrologist. Provide feedback on the resident's thinking and approach.
        Be educational but also realistic in your role. If the resident is making good decisions or showing
        good clinical reasoning, provide positive reinforcement. If there are concerns or important clinical
        considerations they're missing, point these out clearly but constructively.
        
        Your response should include:
        1. Direct answer to any questions
        2. Assessment of their current approach
        3. Guidance on next steps if appropriate
        
        Also include at the end, separated by a pipe character (|), either:
        "COMPLIMENT" if their message demonstrates good clinical reasoning or decision-making
        "CRITICISM" if their message shows concerning gaps or errors in clinical judgment
        "NEUTRAL" if the message is a simple status update or question with no clear quality judgment`;
      
      // Call AI API for attending response
      const response = await fetchAIResponse(prompt);
      
      // Parse the AI response
      const attendingResponse = response.choices[0].message.content;
      
      // Extract the feedback type
      const feedbackMatch = attendingResponse.match(/\|(COMPLIMENT|CRITICISM|NEUTRAL)$/);
      let feedbackType = "NEUTRAL";
      let responseText = attendingResponse;
      
      if (feedbackMatch) {
        feedbackType = feedbackMatch[1];
        responseText = attendingResponse.replace(/\|(COMPLIMENT|CRITICISM|NEUTRAL)$/, "").trim();
      }
      
      // Update the score based on feedback
      let scoreChange = 0;
      if (feedbackType === "COMPLIMENT") scoreChange = 1;
      if (feedbackType === "CRITICISM") scoreChange = -1;
      
      // Add the messages to the chat
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        score: state.score + scoreChange,
        attendingChat: [
          ...state.attendingChat,
          {
            sender: "resident",
            message: message,
            timestamp: new Date(gameTime)
          },
          {
            sender: "attending",
            message: responseText,
            timestamp: new Date(gameTime),
            feedback: feedbackType
          }
        ]
      }));
      
      return { response: responseText, feedback: feedbackType };
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to communicate with the attending. Please try again." 
      });
      console.error("Attending consultation error:", error);
      return null;
    }
  },
  
  // Send a message to the nurse
  communicateWithNurse: async (message) => {
    set({ isLoading: true });
    
    try {
      const { patient, vitals, results, gameTime, nurseChat } = get();
      
      // Prepare prompt for AI
      const prompt = `You are a nurse caring for a nephrology patient.
        The medical resident has sent you the following message:
        "${message}"
        
        Patient information:
        ${patient.demographics.age}y ${patient.demographics.gender[0]}
        Clinical context: ${patient.clinicalContext}
        
        Current vital signs:
        HR: ${vitals.current.hr}
        BP: ${vitals.current.sbp}/${vitals.current.dbp}
        MAP: ${vitals.current.map}
        RR: ${vitals.current.rr}
        Temp: ${vitals.current.temp}
        SpO2: ${vitals.current.spo2}
        
        Recent chat:
        ${nurseChat.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join("\n")}
        
        Respond as a competent, professional nurse. Be helpful and provide information
        that would be within a nurse's scope of practice and knowledge. If there's a task
        that would typically be a nursing responsibility, indicate your understanding and
        action. If the resident is asking for something inappropriate or outside of your
        scope, politely clarify your role limitations.`;
      
      // Call AI API for nurse response
      const response = await fetchAIResponse(prompt);
      
      // Get the nurse response
      const nurseResponse = response.choices[0].message.content;
      
      // Add the messages to the chat
      set(state => ({
        isLoading: false,
        apiCalls: state.apiCalls + 1,
        apiCost: Number((state.apiCost + 0.01).toFixed(2)),
        nurseChat: [
          ...state.nurseChat,
          {
            sender: "resident",
            message: message,
            timestamp: new Date(gameTime)
          },
          {
            sender: "nurse",
            message: nurseResponse,
            timestamp: new Date(gameTime)
          }
        ]
      }));
      
      return nurseResponse;
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Failed to communicate with the nurse. Please try again." 
      });
      console.error("Nurse communication error:", error);
      return null;
    }
  },
  
  // Update the game time
  updateGameTime: (deltaSeconds) => {
    const { gameTime, timeScale } = get();
    
    // Calculate new game time based on time scale
    const newGameTime = new Date(gameTime.getTime() + (deltaSeconds * 1000 * timeScale));
    
    set({ gameTime: newGameTime });
    
    // Check if any interventions have ended
    const { interventions } = get();
    const updatedInterventions = interventions.map(intervention => {
      if (intervention.isActive && intervention.endTime && newGameTime >= intervention.endTime) {
        return { ...intervention, isActive: false };
      }
      return intervention;
    });
    
    // Update interventions if any have changed
    if (JSON.stringify(interventions) !== JSON.stringify(updatedInterventions)) {
      set({ interventions: updatedInterventions });
    }
    
    return newGameTime;
  },
  
  // Update the time scale (relationship between game time and real time)
  setTimeScale: (newScale) => {
    set({ timeScale: newScale });
  }
}));
