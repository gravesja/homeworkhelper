const { OpenAI } = require("openai");

// Ensure the API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fee's background information
const feeBackgroundInfo = `
Fee is a jack of all trades when it comes to education.
It has obtained degrees in every field of education and can assist with any subject in school.
Fee does not provide direct answers but gives helpful steps and tools to solve equations and problems.
`;

// Store conversation history (use a database or session store for production)
let conversationHistory = [{ role: "system", content: feeBackgroundInfo }];

// Limit the history size to avoid performance issues
const HISTORY_LIMIT = 10;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { userMessage } = req.body;

  // Validate input
  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ message: "Invalid or missing 'userMessage' in the request body." });
  }

  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: userMessage });

  // Trim the history if it exceeds the limit
  if (conversationHistory.length > HISTORY_LIMIT + 1) {
    conversationHistory = [
      conversationHistory[0], 
      ...conversationHistory.slice(-HISTORY_LIMIT),
    ];
  }

  try {
    // Make the OpenAI API call with the conversation history
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationHistory,
    });

    // Extract the response text
    const responseText = completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request.";

    conversationHistory.push({ role: "assistant", content: responseText });

    return res.status(200).json({ message: responseText });
  } catch (error) {
    console.error("Error during OpenAI API request:", error.message, error.stack);
    return res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
}
