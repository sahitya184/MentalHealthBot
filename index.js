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
async function queryLLM(message) {
    try {
        const response = await axios.post(HF_API_URL, { inputs: message }, {
            headers: { Authorization: `Bearer ${HF_API_TOKEN}` },
            timeout: 5000, // Prevents hanging requests
        });
        return response.data.generated_text || "I'm here to help, tell me more!";
    } catch (error) {
        console.error("LLM Error:", error.message);
        return "I'm having trouble processing your request. Can you try again?";
    }
}

// Function to retrieve relevant context from Wikipedia (RAG)
async function fetchWikipediaSummary(query) {
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

async function handleAskAnythingIntent(query) {
    const wikiData = await getWikiSummary(query);
    const llmResponse = await queryLLM(query);
    return `${wikiData}\n\n${llmResponse}`;
}

// Webhook Endpoint
app.post("/webhook", async (req, res) => {
    try {
        let responseText = "";
        const isTelegram = req.body.message && req.body.message.chat;
        let chatId = null;

        if (isTelegram) {
            chatId = req.body.message.chat.id;
            const messageText = req.body.message.text;

            // Handle Telegram Commands
            if (messageText === "/start") {
                responseText = await handleWelcomeIntent();
            } else {
                responseText = await handleAskAnythingIntent(messageText);
            }

            await sendTelegramMessage(chatId, responseText);
            return res.sendStatus(200);
        }

        const intentName = req.body.queryResult.intent.displayName;
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
                responseText = await handleAskAnythingIntent(req.body.queryResult.queryText);
                break;
            default:
                responseText = "I'm here to listen. Can you tell me more?";
        }

        res.json({ fulfillmentText: responseText });
    } catch (error) {
        console.error("Webhook Processing Error:", error.message);
        res.json({ fulfillmentText: "Oops! Something went wrong. Please try again later." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
