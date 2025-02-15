const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Load environment variables
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const knowledgeBase = JSON.parse(fs.readFileSync("mental_health_tips.json", "utf8"));
const streakFile = "mood_streaks.json";

// Load mood streaks from a file (Persistent Storage)
let userMoodStreaks = fs.existsSync(streakFile) ? JSON.parse(fs.readFileSync(streakFile, "utf8")) : {};

// Function to save streaks persistently
function saveMoodStreaks() {
    fs.writeFileSync(streakFile, JSON.stringify(userMoodStreaks, null, 2));
}

// Function to call Hugging Face API with timeout
async function getLLMResponse(userInput) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
            { inputs: userInput },
            {
                headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}`, "Content-Type": "application/json" },
                signal: controller.signal, // Attach signal for timeout
            }
        );

        clearTimeout(timeout);
        return response.data.generated_text || "You're not alone. I'm here for you. 💙";
    } catch (error) {
        console.error("Hugging Face API Timeout/Error:", error);
        return "I hear you. Take a deep breath. 💙"; // Fallback response
    }
}

// Function to analyze sentiment (Basic Version)
function detectSentiment(userInput) {
    const positiveWords = ["happy", "great", "excited", "hopeful"];
    const negativeWords = ["sad", "depressed", "stressed", "anxious"];
    
    const isPositive = positiveWords.some(word => userInput.toLowerCase().includes(word));
    const isNegative = negativeWords.some(word => userInput.toLowerCase().includes(word));

    return isPositive ? "positive" : isNegative ? "negative" : "neutral";
}

// Function to provide RAG-based personalized responses
function getRAGResponse(userQuery) {
    const mood = detectSentiment(userQuery);
    const entry = knowledgeBase.find((item) => 
        item.keywords.some((keyword) => userQuery.toLowerCase().includes(keyword))
    );

    if (!entry) return "I couldn't find specific advice, but I'm always here to support you! 💙";
    
    return mood === "negative" ? entry.negative_response || entry.response
         : mood === "positive" ? entry.positive_response || entry.response
         : entry.response;
}

// Function to fetch a joke with timeout
async function getJoke() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
        const jokeResponse = await axios.get("https://official-joke-api.appspot.com/random_joke", { signal: controller.signal });
        clearTimeout(timeout);
        return `${jokeResponse.data.setup}\n${jokeResponse.data.punchline}`;
    } catch (error) {
        console.error("Error fetching joke:", error);
        return "Laughter is the best medicine! 😊";
    }
}

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const userMessage = req.body.queryResult.queryText;
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || "";
    const userId = req.body.session;

    console.log("Received Intent:", intentName);
    console.log("Received Callback Data:", callbackData);

    try {
        res.setHeader("Content-Type", "application/json");

        // Welcome Intent (Main Menu)
        if (intentName === "Welcome Intent") {
            userMoodStreaks[userId] = 0; // Reset streak
            saveMoodStreaks();

            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello there! 👋 I'm your Mental Health Support Bot. 💙"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "How can I support you today? 😊",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "💪 Get Motivation", callback_data: "Get Motivation" }],
                                        [{ text: "😊 Cheer Up", callback_data: "Cheer Up" }],
                                        [{ text: "🌱 Coping Strategies", callback_data: "Coping Strategies" }],
                                        [{ text: "❌ End Chat", callback_data: "End Chat" }]
                                    ]
                                },
                            },
                        },
                    }
                ],
            });
        }

        // Get Motivation (LLM + Mood Streaks)
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            const llmResponse = await getLLMResponse(userMessage);
            userMoodStreaks[userId] = (userMoodStreaks[userId] || 0) + 1;
            saveMoodStreaks();

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [llmResponse] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: `${llmResponse}\n\n🔥 Mood Streak: ${userMoodStreaks[userId]} days! Keep going!`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🔄 Get Another", callback_data: "Get Motivation" }],
                                        [{ text: "🏠 Main Menu", callback_data: "Welcome Intent" }]
                                    ]
                                },
                            },
                        },
                    }
                ],
            });
        }

        // Coping Strategies (RAG-based)
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            const strategy = getRAGResponse(userMessage);

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [strategy] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: strategy,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🌱 Another Tip", callback_data: "Coping Strategies" }],
                                        [{ text: "🏠 Main Menu", callback_data: "Welcome Intent" }]
                                    ]
                                },
                            },
                        },
                    }
                ],
            });
        }

        // Voice Message Detection
        const voiceMessage = req.body.originalDetectIntentRequest?.payload?.data?.message?.voice;
        if (voiceMessage) {
            return res.json({
                fulfillmentMessages: [{ text: { text: ["I heard your voice message! 💙"] } }]
            });
        }

        return res.json({ fulfillmentMessages: [{ text: { text: ["I'm here for you. Let me know how I can help! 💙"] } }] });

    } catch (error) {
        console.error("Error:", error);
        return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong. Please try again."] } }] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
