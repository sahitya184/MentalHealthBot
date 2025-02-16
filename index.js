const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const JOKE_API_URL = "https://v2.jokeapi.dev/joke/Any?format=json";
const QUOTE_API_URL = "https://api.quotable.io/random";

// Function to fetch a joke
async function getJoke() {
    try {
        const response = await axios.get(JOKE_API_URL, { timeout: 5000 });
        if (response.data && response.data.joke) return response.data.joke;
        if (response.data && response.data.setup && response.data.delivery)
            return `${response.data.setup} ${response.data.delivery}`;
    } catch (error) {
        console.error("Joke API failed, falling back to LLM:", error.message);
        return await getLLMResponse("Tell me a funny joke.");
    }
}

// Function to fetch a motivation quote
async function getMotivation() {
    try {
        const response = await axios.get(QUOTE_API_URL, { timeout: 5000 });
        if (response.data && response.data.content) return response.data.content;
    } catch (error) {
        console.error("Quote API failed, falling back to LLM:", error.message);
        return await getLLMResponse("Give me an inspiring quote.");
    }
}

// Function to get a coping strategy using LLM
async function getCopingStrategy() {
    return await getLLMResponse("Give me a helpful coping strategy for stress.");
}

// Function to fetch response from OpenRouter LLM (using axios)
async function getLLMResponse(prompt) {
    try {
        const response = await axios.post(
            "https://api.openrouter.ai/v1/completions", // OpenRouter API endpoint
            {
                model: "openrouter/mistral",
                prompt: prompt,
                max_tokens: 50,
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Ensure choices array is not empty before accessing
        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].text.trim();
        } else {
            return "Sorry, I couldn't generate a response at the moment.";
        }
    } catch (error) {
        console.error("LLM API error:", error.message);
        return "I'm unable to provide a response at the moment. Please try again later.";
    }
}


// Main webhook endpoint
app.post("/webhook", async (req, res) => {
    const intent = req.body.queryResult.intent.displayName;
    let fulfillmentText = "";

    switch (intent) {
        case  "Welcome Intent":
            fulfillmentText = "Hello! I'm your friendly Mental Health Bot. How can I assist you today?";
            break;
        case "cheer up":
            fulfillmentText = await getJoke();
            break;
        case "get motivation":
            fulfillmentText = await getMotivation();
            break;
        case "coping strategies":
            fulfillmentText = await getCopingStrategy();
            break;
        default:
            fulfillmentText = await getLLMResponse(`Respond naturally to: ${req.body.queryResult.queryText}`);
            break;
    }

    res.json({ fulfillmentText });
});

// Telegram webhook endpoint for /start command
app.post("/telegram", async (req, res) => {
    const message = req.body.message;
    if (message && message.text === "/start") {
        res.json({ text: "Welcome to the Mental Health Bot! I'm here to help. How are you feeling today?" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
