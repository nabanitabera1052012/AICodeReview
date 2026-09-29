const aiService = require("../services/ai.service")


module.exports.getReview = async (req, res) => {
    const code = req.body.code;
    const message = req.body.message || req.body.prompt;
    const language = (req.body.language || 'javascript').toLowerCase();

    if (!code && !message) {
        return res.status(400).send("Code or chat message is required");
    }

    let fullPrompt = "";
    if (code && message) {
        fullPrompt = `Target Language: ${req.body.language || 'Code'}\nUser instruction: ${message}\n\nContext Code Snippet:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (code) {
        fullPrompt = `Target Language: ${req.body.language || 'Code'}\n\`\`\`${language}\n${code}\n\`\`\``;
    } else {
        fullPrompt = message;
    }

    try {
        const response = await aiService(fullPrompt);
        res.send(response);
    } catch (error) {
        console.error("AI Service Error:", error);
        res.status(500).send(error.message || "An error occurred while generating the review.");
    }
}