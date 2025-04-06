const GoogleGenAI = require("@google/genai").GoogleGenAI;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });


exports.getAiResponse = async (req, res) => {
    const { contents } = req.body;
    if (!contents) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contents,
        });
        const data = response.candidates[0].content.parts[0].text;
        res.status(200).json({ response: data });
    } catch (error) {
        console.error('AI API Error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
