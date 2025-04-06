const {Translate} = require('@google-cloud/translate').v2;


const projectId = process.env.GOOGLE_PROJECT_ID; // Your Google Cloud Project ID
const translate = new Translate({projectId, key: process.env.GOOGLE_API_KEY}); // Your Google Cloud API Key


exports.translateText = async (req, res)=>{
    const { text, target} = req.body;
    if (!text || !target) {
        return res.status(400).json({ error: 'Text and target language are required' });
    }

    try {
        const [translation] = await translate.translate(text, target);
        res.json({ translation });
    } catch (error) {
        console.error('Translation API Error:', error);
        res.status(500).json({
            error: 'Failed to translate text',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

