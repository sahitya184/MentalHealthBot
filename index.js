const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Load environment variables
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const knowledgeBaseFile = "mental_health_tips.json";
const streakFile = "mood_streaks.json";

if (!HUGGING_FACE_API_KEY) {
    console.error("Missing Hugging Face API Key! Please check your environment variables.");
    process.exit(1); // Exit the program if no API key
}

// Load the knowledge base (Mental Health Tips)
let knowledgeBase = [];
try {
    knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBaseFile, "utf8"));
} catch (error) {
    console.error("Error reading or parsing the knowledge base file:", error.message);
}

// Load mood streaks from a file (Persistent Storage)
let userMoodStreaks = fs.existsSync(streakFile) ? JSON.parse(fs.readFileSync(streakFile, "utf8")) : {};

// Function to save streaks persistently
function saveMoodStreaks() {
    fs.writeFileSync(streakFile, JSON.stringify(userMoodStreaks, null, 2));
}

// Hugging Face API Call
async function getLLMResponse(userInput) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
            { inputs: userInput },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}`, "Content-Type": "application/json" } }
        );

        // Return empathetic response
        return response.data?.generated_text || "I'm here for you. Let's talk it out. 💙";
    } catch (error) {
        console.error("Hugging Face API Error:", error.message);
        return "I'm here for you. Take a deep breath. 💙";
    }
}

// Sentiment Detection
function detectSentiment(userInput) {
    const positiveWords = ["happy", "great", "excited", "hopeful"];
    const negativeWords = ["sad", "depressed", "stressed", "anxious"];
    const isPositive = positiveWords.some(word => userInput.toLowerCase().includes(word));
    const isNegative = negativeWords.some(word => userInput.toLowerCase().includes(word));
    return isPositive ? "positive" : isNegative ? "negative" : "neutral";
}

// RAG-based response
function getRAGResponse(userQuery) {
    const mood = detectSentiment(userQuery);
    const entry = knowledgeBase.find(item => item.keywords.some(keyword => userQuery.toLowerCase().includes(keyword)));
    if (!entry) return "I couldn't find specific advice, but I'm always here to support you! 💙";
    return mood === "negative" ? entry.negative_response || entry.response
        : mood === "positive" ? entry.positive_response || entry.response
        : entry.response;
}

// Joke for Cheer Up
async function getJoke() {
    try {
        const jokeResponse = await axios.get("https://official-joke-api.appspot.com/random_joke");
        return `${jokeResponse.data.setup}\n${jokeResponse.data.punchline}`;
    } catch (error) {
        console.error("Error fetching joke:", error);
        return "Laughter is the best medicine! 😊";
    }
}

// Handle Webhook requests
app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName || "";
    const userMessage = req.body.queryResult?.queryText || "";
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || "";
    const userId = req.body.session;

    if (!intentName || !userMessage) {
        return res.status(400).json({
            fulfillmentMessages: [{ text: { text: ["Sorry, I didn't understand your request."] } }]
        });
    }

    try {
        res.setHeader("Content-Type", "application/json");

        // Welcome Intent (Proactive Message)
        if (intentName === "Welcome Intent") {
            userMoodStreaks[userId] = 0;
            saveMoodStreaks();

            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello! 👋 I'm here to support your mental health. 💙"] } },
                    { text: { text: ["I can help you with:\n✅ Motivation\n😊 Cheer Up with Jokes\n🌱 Coping Strategies\n💭 Share Your Feelings"] } },
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
                                        [{ text: "💬 Share My Feelings", callback_data: "Share My Feelings" }],
                                        [{ text: "📅 Daily Mood Check-in", callback_data: "Daily Mood Check-in" }],
                                        [{ text: "❌ End Chat", callback_data: "End Chat" }]
                                    ]
                                },
                            },
                        },
                    }
                ],
            });
        }

        // Get Motivation
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

        // Cheer Up
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            const joke = await getJoke();

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [joke] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: joke,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "😊 Another Joke", callback_data: "Cheer Up" }],
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
                    { text: { text: [strategy] } }
                ],
            });
        }

        // Share My Feelings
        if (intentName === "Share My Feelings" || callbackData === "Share My Feelings") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I'm here to listen. How are you feeling today? 💙"] } }
                ],
            });
        }

        // Handle voice messages
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
