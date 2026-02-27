const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require('../config/database');

const analyzeProfile = async (req, res) => {
    try {
        let userId = req.user.id;

        // If admin is requesting analysis for a candidate
        if (req.user.role === 'admin' && req.query.candidateId) {
            userId = req.query.candidateId;
        }

        const result = await pool.query(
            `SELECT u.name, u.email, u.phone, p.*
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const profile = result.rows[0];

        if (!profile.user_id) {
            return res.status(400).json({
                message: 'Profile is empty! Please fill out and save your profile details first.'
            });
        }

        console.log('Detected GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'YES (Starts with ' + process.env.GEMINI_API_KEY.slice(0, 4) + ')' : 'NO');

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message: 'Gemini API Key is missing. Please add GEMINI_API_KEY to your .env file.'
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        if (!profile.skills && !profile.projects && !profile.work_experience) {
            return res.status(400).json({
                message: 'Your profile is looking a bit thin! Please add some Skills or Projects first so the AI has something to analyze.'
            });
        }

        const prompt = `
            Analyze the following candidate profile for an interview platform.
            Provide a JSON response with:
            1. "readinessScore": (0-100)
            2. "strengths": [List of 3-5 strings]
            3. "improvements": [List of 3-5 strings]
            4. "suggestedRoles": [List of 3 strings]
            5. "marketAnalysis": "A short 2-3 sentence overview of their current standing in the tech market."

            Profile Data:
            Name: ${profile.name}
            Degree: ${profile.degree || 'Not provided'}
            Skills: ${JSON.stringify(profile.skills || {})}
            Projects: ${JSON.stringify(profile.projects || [])}
            Experience: ${JSON.stringify(profile.work_experience || [])}
            Preferred Role: ${profile.preferred_role || 'Not provided'}

            Return ONLY raw JSON, no markdown formatting.
        `;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        console.log('Gemini response received. Length:', text.length);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        res.json({ analysis });
    } catch (err) {
        console.error('AI Analysis Exception:', err);
        res.status(500).json({
            message: 'AI Analysis failed. This could be due to a malformed response or an invalid API key.',
            error: err.message
        });
    }
};

module.exports = { analyzeProfile };
