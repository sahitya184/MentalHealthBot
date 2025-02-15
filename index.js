const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

require("dotenv").config(); // Load environment variables

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;


//const HUGGING_FACE_API_KEY = "your_hugging_face_api_key"; // Replace with your Hugging Face API Key

// Load knowledge base for RAG (Example: JSON file)
const knowledgeBase = JSON.parse(fs.readFileSync("mental_health_tips.json", "utf8"));

// Store user mood streaks (Temporary storage)
let userMoodStreaks = {};

// Function to call Hugging Face API for LLM-based responses
const huggingFaceAPIKey = process.env.HUGGINGFACE_API_KEY; // Load API key from .env

async function getLLMResponse(userInput) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
            { inputs: userInput },
            {
                headers: {
                    Authorization: `Bearer ${huggingFaceAPIKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.generated_text || "You're not alone. I'm here for you. 💙";
    } catch (error) {
        console.error("Hugging Face API Error:", error);
        return "I hear you. Take a deep breath. 💙";
    }
}

// Function to provide RAG-based responses
function getRAGResponse(userQuery) {
    const entry = knowledgeBase.find((item) => item.keywords.some((keyword) => userQuery.toLowerCase().includes(keyword)));
    return entry ? entry.response : "I couldn't find specific advice, but I'm always here to support you! 💙";
}

// Function to detect sentiment
function detectSentiment(text) {
    const negativeWords = ["sad", "depressed", "anxious", "stressed", "hopeless", "lonely"];
    return negativeWords.some((word) => text.toLowerCase().includes(word)) ? "negative" : "positive";
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
            userMoodStreaks[userId] = 0; // Reset streaks when a user starts a chat
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

        // Get Motivation (LLM-based)
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            const llmResponse = await getLLMResponse("I need motivation");
            userMoodStreaks[userId] = (userMoodStreaks[userId] || 0) + 1; // Increase mood streak

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

        // Cheer Up (Jokes)
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            try {
                const jokeResponse = await axios.get("https://official-joke-api.appspot.com/random_joke");
                const joke = `${jokeResponse.data.setup}\n${jokeResponse.data.punchline}`;

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
                                            [{ text: "🤣 Another One!", callback_data: "Cheer Up" }],
                                            [{ text: "🏠 Main Menu", callback_data: "Welcome Intent" }]
                                        ]
                                    },
                                },
                            },
                        }
                    ],
                });
            } catch (error) {
                console.error("Error fetching joke:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Laughter is the best medicine! 😊"] } }] });
            }
        }

        // Coping Strategies (RAG-based)
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            const strategy = getRAGResponse("coping strategies");

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

        // Handling Voice Messages
        const voiceMessage = req.body.originalDetectIntentRequest?.payload?.data?.message?.voice;
        if (voiceMessage) {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I heard your voice message! While I can’t process audio yet, I'm here to support you. 💙"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Try typing your message, and I'll do my best to help! 😊",
                            },
                        },
                    }
                ],
            });
        }

        // End Chat
        if (callbackData === "End Chat") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Chat ended. If you need support again, just type *'start'* to begin a new conversation. 💙"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Chat ended. If you need support again, just type *'start'*. Take care! 💙",
                            },
                        },
                    }
                ],
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
