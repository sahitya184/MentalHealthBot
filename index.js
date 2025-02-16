const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY; // Store the Hugging Face API key here
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

// Function to fetch response from Hugging Face LLM (using axios)
async function getLLMResponse(prompt, retries = 5) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-small",
            { inputs: prompt },
            {
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000, // Increase timeout to handle model loading
            }
        );

        if (response.data && response.data.error && response.data.estimated_time) {
            console.log(`Model is still loading. Estimated time: ${response.data.estimated_time}s. Retries left: ${retries}`);

            if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, response.data.estimated_time * 1000));
                return getLLMResponse(prompt, retries - 1);
            } else {
                throw new Error("Model still loading after retries.");
            }
        }

        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            return response.data[0].generated_text.trim();
        } else if (response.data?.generated_text) {
            return response.data.generated_text.trim();
        } else {
            return "No valid response received from the LLM.";
        }
        
    } catch (error) {
        console.error("Hugging Face API error:", error.response ? error.response.data : error.message);
        return "I'm having trouble fetching a response. Let's try something else. 💙";

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

    res.json({
        fulfillmentMessages: [
            {
                text: { text: [fulfillmentText] }
            }
        ]
    });
    
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
