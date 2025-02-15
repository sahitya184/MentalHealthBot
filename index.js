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
    console.error("Missing Hugging Face API Key!");
    process.exit(1);
}

// Initialize data stores
let knowledgeBase = [];
let userMoodStreaks = {};

try {
    if (fs.existsSync(knowledgeBaseFile)) {
        knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBaseFile, "utf8"));
    }
    if (fs.existsSync(streakFile)) {
        userMoodStreaks = JSON.parse(fs.readFileSync(streakFile, "utf8"));
    }
} catch (error) {
    console.error("Error reading files:", error.message);
}

// Save mood streaks
function saveMoodStreaks() {
    try {
        fs.writeFileSync(streakFile, JSON.stringify(userMoodStreaks, null, 2));
    } catch (error) {
        console.error("Error saving mood streaks:", error);
    }
}

// Create platform-specific response
function createResponse(text, buttons = []) {
    const response = {
        fulfillmentMessages: [
            {
                text: {
                    text: [text]
                }
            }
        ]
    };

    // Add Telegram-specific response if buttons are present
    if (buttons.length > 0) {
        response.fulfillmentMessages.push({
            platform: "TELEGRAM",
            payload: {
                telegram: {
                    text: text,
                    reply_markup: {
                        inline_keyboard: buttons.map(row => 
                            row.map(button => ({
                                text: button.text,
                                callback_data: button.callback
                            }))
                        )
                    }
                }
            }
        });

        // Add Dialogflow Messenger response
        response.fulfillmentMessages.push({
            payload: {
                richContent: [[
                    ...buttons.flat().map(button => ({
                        type: "button",
                        icon: {
                            type: "chevron_right",
                            color: "#FF9800"
                        },
                        text: button.text,
                        link: button.callback,
                        event: {
                            name: button.callback,
                            languageCode: "en-US"
                        }
                    }))
                ]]
            }
        });
    }

    return response;
}

// Get response from Hugging Face
async function getLLMResponse(userInput) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
            { inputs: userInput },
            { 
                headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
                timeout: 5000
            }
        );
        return response.data?.generated_text || "I'm here to support you. 💙";
    } catch (error) {
        console.error("Hugging Face API Error:", error.message);
        return "I'm here to listen and support you. 💙";
    }
}

// Get a random joke
async function getJoke() {
    try {
        const response = await axios.get("https://official-joke-api.appspot.com/random_joke", { timeout: 3000 });
        return `${response.data.setup}\n${response.data.punchline}`;
    } catch (error) {
        return "Why did the chatbot become a therapist? Because it had great byte-side manner! 😊";
    }
}

// Main webhook handler
app.post("/webhook", async (req, res) => {
    try {
        const intentName = req.body.queryResult?.intent?.displayName;
        const userMessage = req.body.queryResult?.queryText || "";
        const userId = req.body.session || "anonymous";

        if (!intentName) {
            return res.json(createResponse("I didn't understand that. Could you try again?"));
        }

        switch (intentName) {
            case "Welcome Intent": {
                userMoodStreaks[userId] = 0;
                saveMoodStreaks();
                
                const welcomeText = "Hello! 👋 I'm here to support your mental health. 💙\n\nHow can I help you today?";
                const buttons = [
                    [
                        { text: "💪 Get Motivation", callback: "Get Motivation" },
                        { text: "😊 Cheer Up", callback: "Cheer Up" }
                    ],
                    [
                        { text: "🌱 Coping Strategies", callback: "Coping Strategies" },
                        { text: "💭 Share Feelings", callback: "Share My Feelings" }
                    ],
                    [
                        { text: "📅 Daily Check-in", callback: "Daily Mood Check-in" },
                        { text: "❌ End Chat", callback: "End Chat" }
                    ]
                ];
                
                return res.json(createResponse(welcomeText, buttons));
            }

            case "Get Motivation": {
                const llmResponse = await getLLMResponse(userMessage);
                userMoodStreaks[userId] = (userMoodStreaks[userId] || 0) + 1;
                saveMoodStreaks();
                
                const motivationText = `${llmResponse}\n\n🔥 Mood Streak: ${userMoodStreaks[userId]} days!\n\n💪 You've got this!`;
                const buttons = [
                    [
                        { text: "🔄 Another Motivation", callback: "Get Motivation" },
                        { text: "🏠 Main Menu", callback: "Welcome Intent" }
                    ]
                ];
                
                return res.json(createResponse(motivationText, buttons));
            }

            case "Cheer Up": {
                const joke = await getJoke();
                const buttons = [
                    [
                        { text: "😊 Another Joke", callback: "Cheer Up" },
                        { text: "🏠 Main Menu", callback: "Welcome Intent" }
                    ]
                ];
                
                return res.json(createResponse(joke, buttons));
            }

            case "Share My Feelings": {
                const response = "I'm here to listen. How are you feeling today? 💙";
                const buttons = [
                    [
                        { text: "😊 Good", callback: "Feeling Good" },
                        { text: "😐 Okay", callback: "Feeling Okay" },
                        { text: "😔 Not Good", callback: "Feeling Bad" }
                    ]
                ];
                
                return res.json(createResponse(response, buttons));
            }

            case "Daily Mood Check-in": {
                const checkInText = "How are you feeling today? Your mental health matters! 💙";
                const buttons = [
                    [
                        { text: "😊 Great", callback: "Mood_Great" },
                        { text: "😐 Okay", callback: "Mood_Okay" },
                        { text: "😔 Not Good", callback: "Mood_NotGood" }
                    ]
                ];
                
                return res.json(createResponse(checkInText, buttons));
            }

            case "Coping Strategies": {
                const strategies = "Here are some coping strategies:\n\n" +
                    "1. Deep breathing exercises 🫁\n" +
                    "2. Mindful meditation 🧘\n" +
                    "3. Physical exercise 🏃\n" +
                    "4. Talking to friends 👥\n" +
                    "5. Journal writing ✍️";
                
                const buttons = [
                    [
                        { text: "🔍 More Strategies", callback: "More Strategies" },
                        { text: "🏠 Main Menu", callback: "Welcome Intent" }
                    ]
                ];
                
                return res.json(createResponse(strategies, buttons));
            }

            case "End Chat": {
                return res.json(createResponse("Take care! Remember, I'm always here if you need support. 💙"));
            }

            default: {
                const defaultResponse = await getLLMResponse(userMessage);
                return res.json(createResponse(defaultResponse));
            }
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        return res.json(createResponse("I'm having trouble right now. Could you try again?"));
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));