const vm = require('vm');
const { analyzeCandidateProfile } = require('../utils/gemini');

const executeCode = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ message: 'No code provided' });
    }

    if (language !== 'javascript') {
        return res.status(400).json({ message: 'Only JavaScript is supported currently.' });
    }

    let output = '';
    const sandbox = {
        console: {
            log: (...args) => {
                output += args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            },
            error: (...args) => {
                output += 'Error: ' + args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            }
        },
        process: {
            env: {}
        },
        setTimeout,
        clearTimeout
    };

    try {
        const script = new vm.Script(code);
        const context = vm.createContext(sandbox);

        script.runInContext(context, { timeout: 3000 });

        res.json({
            success: true,
            output: output || 'Code executed successfully (no output).'
        });
    } catch (err) {
        res.status(200).json({
            success: false,
            output: `Runtime Error: ${err.message}`
        });
    }
};

const analyzeCandidate = async (req, res) => {
    try {
        const { name, skills, experience, preferred_role } = req.body;
        const analysis = await analyzeCandidateProfile({ name, skills, experience, preferred_role });
        res.json({ success: true, analysis });
    } catch (err) {
        console.error('Analysis controller error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { executeCode, analyzeCandidate };
