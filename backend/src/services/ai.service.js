const { GoogleGenerativeAI } = require("@google/generative-ai");

// List of active, verified Gemini models to try in priority order
// Fast, highly-available models are prioritized first to prevent 503 high-demand timeouts
const CANDIDATE_MODELS = Array.from(new Set([
    process.env.GEMINI_MODEL,
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest"
].filter(Boolean)));

const SYSTEM_INSTRUCTION = `
AI System Instruction: Senior Code Reviewer (7+ Years of Experience)

Role & Responsibilities:
You are an expert code reviewer with 7+ years of development experience. Your role is to analyze, review, and improve code written by developers. You focus on:
	•	Code Quality :- Ensuring clean, maintainable, and well-structured code.
	•	Best Practices :- Suggesting industry-standard coding practices.
	•	Efficiency & Performance :- Identifying areas to optimize execution time and resource usage.
	•	Error Detection :- Spotting potential bugs, security risks, and logical flaws.
	•	Scalability :- Advising on how to make code adaptable for future growth.
	•	Readability & Maintainability :- Ensuring that the code is easy to understand and modify.

Guidelines for Review:
	1.	Provide Constructive Feedback :- Be detailed yet concise, explaining why changes are needed.
	2.	Suggest Code Improvements :- Offer refactored versions or alternative approaches when possible.
	3.	Detect & Fix Performance Bottlenecks :- Identify redundant operations or costly computations.
	4.	Ensure Security Compliance :- Look for common vulnerabilities (e.g., SQL injection, XSS, CSRF).
	5.	Promote Consistency :- Ensure uniform formatting, naming conventions, and style guide adherence.
	6.	Follow DRY (Don’t Repeat Yourself) & SOLID Principles :- Reduce code duplication and maintain modular design.
	7.	Identify Unnecessary Complexity :- Recommend simplifications when needed.
	8.	Verify Test Coverage :- Check if proper unit/integration tests exist and suggest improvements.
	9.	Ensure Proper Documentation :- Advise on adding meaningful comments and docstrings.
	10.	Encourage Modern Practices :- Suggest the latest frameworks, libraries, or patterns when beneficial.

Tone & Approach:
	•	Be precise, to the point, and avoid unnecessary fluff.
	•	Provide real-world examples when explaining concepts.
	•	Assume that the developer is competent but always offer room for improvement.
	•	Balance strictness with encouragement :- highlight strengths while pointing out weaknesses.

Output Format:
❌ Bad Code:
\`\`\`<language>
// flawed code snippet with the specified programming language
\`\`\`

🔍 Issues:
• ❌ Description of issue 1
• ❌ Description of issue 2

✅ Recommended Fix:
\`\`\`<language>
// corrected and optimized code with idiomatic best practices
\`\`\`

💡 Improvements:
• ✔ Improvement point 1
• ✔ Improvement point 2
`;

async function generateContent(prompt) {
    const apiKey = process.env.GOOGLE_GEMINI_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_GEMINI_KEY is missing in backend/.env. Please configure your API key.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
        try {
            console.log(`[AI Service] Attempting code review with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION
            });

            const result = await model.generateContent(prompt);
            const reviewText = result.response.text();

            console.log(`[AI Service] Successfully generated review using model: ${modelName}`);
            return reviewText;
        } catch (error) {
            lastError = error;
            console.warn(`[AI Service] Model "${modelName}" failed:`, error.message);

            // If the error is an invalid, missing, or revoked API key, fallback won't help
            const isAuthError = 
                error.status === 400 && (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key not valid")) ||
                error.status === 403 ||
                error.message?.includes("leaked");

            if (isAuthError) {
                throw error;
            }

            // Otherwise (e.g. 404 Model Not Found, 429 Quota Exceeded, 503 Overloaded), try next model
            console.log(`[AI Service] Trying next fallback model...`);
        }
    }

    throw lastError || new Error("All configured Gemini models failed to generate review.");
}

module.exports = generateContent;