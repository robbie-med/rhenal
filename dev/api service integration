// src/services/aiService.js

// API configuration
const AI_ENDPOINT = "https://api.ppq.ai/chat/completions";
const API_KEY = process.env.REACT_APP_API_KEY || "sk-7sulP0Nq2oGR8PoB9lXAsg"; // Should use environment variables
const API_MODEL = "gpt-4o";

/**
 * Makes a call to the AI API with the given prompt
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<Object>} - The API response
 */
export const fetchAIResponse = async (prompt) => {
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch AI response:", error);
    throw error;
  }
};

/**
 * Creates a prompt template for medical cases
 * @param {string} caseType - Type of case (ED, inpatient, post-op)
 * @returns {string} - Formatted prompt for case generation
 */
export const createCasePrompt = (caseType = "random") => {
  return `Create a detailed nephrology case for a medical education simulation.
    
    Case type: ${caseType === "random" ? "Choose from ED, inpatient, or post-op" : caseType}
    
    Include in your response:
    1. Patient demographics (name, age, gender, weight in kg, height in cm)
    2. Chief complaint and clinical context
    3. Relevant past medical history, especially nephrology-related conditions
    4. Current medications
    5. Initial vital signs (HR, BP, RR, Temp, SpO2)
    6. Key laboratory findings relevant to the case
    7. Physical examination findings
    
    Focus on creating a realistic and educational case involving one of these nephrology conditions:
    - Acute kidney injury (pre-renal, intrinsic, post-renal)
    - Electrolyte disorders (Na, K, Ca, Mg imbalances)
    - Acid-base disorders
    - Glomerular diseases
    - Fluid management challenges
    - Medication-induced nephrotoxicity
    - Renal manifestations of systemic diseases
    
    Format your response as a JSON object with the following structure:
    {
      "demographics": {
        "name": string,
        "age": number,
        "gender": string,
        "weight": number,
        "height": number
      },
      "location": string (ED/inpatient/post-op),
      "clinicalContext": string,
      "history": string,
      "comorbidities": string[],
      "medications": string[],
      "vitals": {
        "hr": number,
        "sbp": number,
        "dbp": number,
        "rr": number,
        "temp": number,
        "spo2": number
      },
      "labs": {
        "keyFindings": string[],
        "detailedResults": object
      },
      "physicalExam": string[]
    }`;
};

/**
 * Formats a prompt for lab results based on the patient case
 * @param {Object} patient - Patient information
 * @param {string} labTest - Name of the lab test
 * @returns {string} - Formatted prompt for lab result generation
 */
export const createLabResultPrompt = (patient, labTest) => {
  return `Generate realistic laboratory results for the following test: ${labTest}
    
    Patient information:
    - ${patient.demographics.age} year old ${patient.demographics.gender}
    - Weight: ${patient.demographics.weight} kg
    - Clinical context: ${patient.clinicalContext}
    - Relevant history: ${patient.history}
    - Comorbidities: ${patient.comorbidities.join(", ")}
    
    The results should be medically accurate and consistent with the patient's clinical condition.
    Include reference ranges and units as appropriate.
    
    Format the response as a JSON object:
    {
      "testName": string,
      "results": {
        // Test-specific results with appropriate units and reference ranges
      },
      "interpretation": string,
      "clinicalSignificance": string,
      "timeToResult": number // Realistic time in minutes for this test to be completed
    }`;
};

/**
 * Creates a prompt for intervention responses
 * @param {Object} patient - Patient information
 * @param {Object} intervention - Details of the intervention
 * @param {Object} vitals - Current vital signs
 * @returns {string} - Formatted prompt
 */
export const createInterventionPrompt = (patient, intervention, vitals, activeInterventions = []) => {
  const activeInterventionsText = activeInterventions.length > 0 
    ? `Active interventions:\n${activeInterventions.map(i => 
        `- ${i.name} (${i.dosage}) - started ${i.duration} minutes ago`).join("\n")}`
    : "No other active interventions.";

  return `A nephrology patient has received the following intervention: ${intervention.name} ${intervention.dosage} ${intervention.route}.
    
    Patient information:
    - ${patient.demographics.age} year old ${patient.demographics.gender}
    - Weight: ${patient.demographics.weight} kg
    - Clinical context: ${patient.clinicalContext}
    
    Current vital signs:
    - HR: ${vitals.hr}
    - BP: ${vitals.sbp}/${vitals.dbp}
    - RR: ${vitals.rr}
    - Temp: ${vitals.temp}°C
    - SpO2: ${vitals.spo2}%
    
    ${activeInterventionsText}
    
    Based on the patient's condition and this intervention, describe:
    1. The expected physiological response
    2. Potential effects on vital signs
    3. Estimated time until effects would be observed
    4. Any potential adverse effects to monitor for
    
    Format the response as a JSON object:
    {
      "primaryEffect": string,
      "vitalSignEffects": {
        "hr": { "direction": string, "magnitude": string, "explanation": string },
        "bp": { "direction": string, "magnitude": string, "explanation": string },
        "rr": { "direction": string, "magnitude": string, "explanation": string },
        "other": string
      },
      "timeToEffect": number, // Minutes until effects begin
      "duration": number, // Approximate duration of effects in minutes
      "adverseEffects": string[],
      "monitoringRecommendations": string[]
    }`;
};
