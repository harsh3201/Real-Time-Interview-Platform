const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeCandidateProfile = async (candidateData) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze the following candidate's profile for an interview platform.
            Provide a strategic market readiness report in JSON format.
            
            Candidate Name: ${candidateData.name}
            Skills: ${JSON.stringify(candidateData.skills)}
            Experience: ${JSON.stringify(candidateData.experience)}
            Preferred Role: ${candidateData.preferred_role}
            
            The JSON response MUST include:
            1. readinessScore: (0-100 number)
            2. marketAnalysis: (2-3 sentences summary)
            3. suggestedRoles: (array of 3 specific job roles)
            4. gaps: (array of 3 areas for improvement)
            
            Return ONLY the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        throw new Error('Failed to analyze profile with AI');
    }
};

module.exports = { analyzeCandidateProfile };

