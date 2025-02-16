require("dotenv").config(); // Load environment variables
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

// Hugging Face API for LLM responses (Free model)
const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
const HF_API_TOKEN = process.env.HF_API_TOKEN; // Loaded from .env file

// Wikipedia API for Retrieval-Augmented Generation (RAG)
const WIKI_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Middleware
app.use(bodyParser.json());

// Function to query Hugging Face model with error handling
async function queryLLM(question) {
    try {
        const apiUrl = "https://api-inference.huggingface.co/models/google/flan-t5-large";
        const headers = { "Authorization": `Bearer ${process.env.HF_API_TOKEN}` };
        const payload = { "inputs": question };

        const response = await axios.post(apiUrl, payload, { headers, timeout: 10000 }); // Increased timeout

        console.log("LLM Raw Response:", response.data); // Debugging log

        if (response.data && response.data.length > 0) {
            return response.data[0].generated_text || "I'm having trouble finding an answer right now.";
        } else {
            return "Hmm, I couldn't generate a response for that. Try asking something else.";
        }
    } catch (error) {
        console.error("LLM API Error:", error.response ? error.response.data : error.message);
        return "Sorry, I'm having trouble retrieving information at the moment.";
    }
}

// Function to retrieve relevant context from Wikipedia (RAG)
async function getWikiSummary(query) {
    try {
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        if (response.data.extract) {
            return response.data.extract; // Return the summary
        } else {
            return "Sorry, I couldn't find that information. Can you ask something else?";
        }
    } catch (error) {
        console.error("Wikipedia API Error:", error.message);
        return "I'm having trouble retrieving this information right now. Please try again later.";
    }
}

// Function to send message to Telegram
async function sendTelegramMessage(chatId, text) {
    try {
        await axios.post(TELEGRAM_API_URL, { chat_id: chatId, text });
    } catch (error) {
        console.error("Telegram Message Error:", error.message);
    }
}

// Intent Handlers
async function handleWelcomeIntent() {
    return "Hey there! I'm your mental health companion. How are you feeling today? 😊";
}

async function handleCheerUpIntent() {
    return "I’ve got a joke for you! Why don’t skeletons fight each other? Because they don’t have the guts! 😆";
}

async function handleGetMotivationIntent() {
    return "You are stronger than you think! Every challenge is an opportunity to grow. 🌟";
}

async function handleCopingStrategiesIntent() {
    return "Take a deep breath. Try the 4-7-8 technique: Inhale for 4 seconds, hold for 7, and exhale for 8. Works wonders! 🌬️";
}

async function handleAskAnythingIntent(userQuery, sessionId) {
    try {
        if (!userQuery) {
            console.error("Error: userQuery is undefined or empty");
            return "Sorry, I couldn't understand that. Can you rephrase?";
        }

        console.log(`Fetching answer for: ${userQuery}`);

        // Wikipedia API request
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(userQuery)}`);
        
        if (response.status === 404) {
            console.warn(`Wikipedia API: No article found for "${userQuery}"`);
            
            // Return a response that sets a follow-up context
            return {
                fulfillmentText: "I couldn't find an answer for that. Would you like me to explain it in simpler terms?",
                outputContexts: [
                    {
                        name: `projects/mentalhealthbot-uwmv/agent/sessions/${sessionId}/contexts/ask_anything_followup`,
                        lifespanCount: 2,
                        parameters: { query: userQuery }
                    }
                ]
            };
        }

        if (!response.ok) {
            console.error(`Wikipedia API Error: ${response.statusText}`);
            return "I couldn't find an answer right now. Please try again later.";
        }

        const data = await response.json();
        return data.extract || "I couldn't find an answer for that.";

    } catch (error) {
        console.error("Error in handleAskAnythingIntent:", error.message);
        return "Oops! Something went wrong. Please try again.";
    }
}

async function handleYesResponse(sessionId) {
    console.log(`User confirmed with 'Yes' (Session: ${sessionId})`);
    
    // Define what should happen when the user says "Yes"
    return "Great! Let's continue. What would you like to do next?";
}


// Webhook Endpoint

app.post("/webhook", async (req, res) => {
    try {
        let responseText = "";
        const isTelegram = req.body.message && req.body.message.chat;
        let chatId = null;

        if (isTelegram) {
            chatId = req.body.message.chat.id;
            const messageText = req.body.message.text.toLowerCase(); // Convert to lowercase for consistency

            // Handle Telegram Commands
            if (messageText === "/start") {
                responseText = await handleWelcomeIntent();
            } else if (messageText === "yes") {
                responseText = await handleYesResponse(chatId);  // Handle "Yes" response
            } else {
                responseText = await handleAskAnythingIntent(messageText, chatId);  // Pass chatId as sessionId
            }

            await sendTelegramMessage(chatId, responseText);
            return res.sendStatus(200);
        }

        // 🔹 Check if queryResult exists
        if (!req.body.queryResult) {
            console.error("Error: queryResult is undefined. Received payload:", req.body);
            return res.json({ fulfillmentText: "Sorry, something went wrong. Please try again!" });
        }

        // Extract sessionId from request
        const sessionId = req.body.session ? req.body.session.split("/").pop() : "unknown_session";
        const intentName = req.body.queryResult.intent.displayName;
        const userQuery = req.body.queryResult.queryText.toLowerCase() || "No query detected";  // Convert to lowercase

        console.log(`Received Intent: ${intentName}, User Query: ${userQuery}, Session ID: ${sessionId}`);

        switch (intentName) {
            case "Welcome Intent":
                responseText = await handleWelcomeIntent();
                break;
            case "Cheer Up":
                responseText = await handleCheerUpIntent();
                break;
            case "Get Motivation":
                responseText = await handleGetMotivationIntent();
                break;
            case "Coping Strategies":
                responseText = await handleCopingStrategiesIntent();
                break;
            case "Ask Anything":
                responseText = await handleAskAnythingIntent(userQuery, sessionId);  // Pass sessionId
                break;
            case "Yes Intent":  // If "Yes" is detected as an intent
                responseText = await handleYesResponse(sessionId);
                break;
            default:
                responseText = "I'm here to listen. Can you tell me more?";
        }

        // ✅ Properly formatted response for Dialogflow (including outputContexts)
        const responsePayload = {
            fulfillmentText: responseText,  // Main response message
            outputContexts: [
                {
                    name: `projects/${req.body.session.split("/")[1]}/agent/sessions/${sessionId}/contexts/ask_anything_followup`,
                    lifespanCount: 2,
                    parameters: { query: userQuery }
                }
            ]
        };

        res.json(responsePayload);

    } catch (error) {
        console.error("Webhook Processing Error:", error.message, error.stack);
        res.json({ fulfillmentText: "Oops! Something went wrong. Please try again later." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
