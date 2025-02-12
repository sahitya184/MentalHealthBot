const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data;

    try {
        // Welcome Intent
        if (intentName === "Welcome Intent") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello there! 👋 Welcome to your safe space. 🌈\n\nI’m here to support you. What would you like to explore?"] } },
                    {
                        payload: {
                            telegram: {
                                text: "Choose an option:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "💪 Get Motivation", callback_data: "Get Motivation" }],
                                        [{ text: "😊 Cheer Up", callback_data: "Cheer Up" }],
                                        [{ text: "🌱 Coping Strategies", callback_data: "Coping Strategies" }],
                                    ],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Get Motivation
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            const response = await fetch("https://zenquotes.io/api/random");
            const data = await response.json();
            const quote = data[0]?.q || "Stay strong, you're doing great! 💪";
            const author = data[0]?.a || "Unknown";

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [`"${quote}" – ${author}`] } },
                    {
                        payload: {
                            telegram: {
                                text: "Would you like another quote?",
                                reply_markup: {
                                    inline_keyboard: [[{ text: "🔄 Another Quote", callback_data: "Get Motivation" }]],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Cheer Up (Jokes)
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I’d love to make you smile! 😊 What kind of joke would you like?"] } },
                    {
                        payload: {
                            telegram: {
                                text: "Choose a joke type:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🤣 Random", callback_data: "Random Joke" }],
                                        [{ text: "😂 Pun", callback_data: "Pun" }],
                                        [{ text: "🤭 Knock-Knock", callback_data: "Knock-Knock" }],
                                    ],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Cheer Up - Type (Joke Selection)
        if (intentName === "cheer up - type" || ["Random Joke", "Pun", "Knock-Knock"].includes(callbackData)) {
            let jokeResponse;
            if (callbackData === "Pun") {
                jokeResponse = "I’m reading a book on anti-gravity… It’s impossible to put down! 😂";
            } else if (callbackData === "Knock-Knock") {
                jokeResponse = "Knock, knock. \nWho's there? \nOlive. \nOlive who? \nOlive you and I miss you! ❤️";
            } else {
                const jokeAPI = await axios.get("https://official-joke-api.appspot.com/jokes/random");
                jokeResponse = `${jokeAPI.data.setup} ... ${jokeAPI.data.punchline}`;
            }

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [jokeResponse] } },
                    {
                        payload: {
                            telegram: {
                                text: "Want another joke?",
                                reply_markup: {
                                    inline_keyboard: [[{ text: "😂 Another One", callback_data: "Cheer Up" }]],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Coping Strategies
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Coping strategies help manage stress. What type would you like?"] } },
                    {
                        payload: {
                            telegram: {
                                text: "Select a category:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🧘 Mindfulness", callback_data: "Mindfulness" }],
                                        [{ text: "🏃 Exercise", callback_data: "Exercise" }],
                                        [{ text: "📖 Journaling", callback_data: "Journaling" }],
                                    ],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Coping Strategies - Choice
        if (intentName === "coping strategies - choice" || ["Mindfulness", "Exercise", "Journaling"].includes(callbackData)) {
            let strategyResponse;
            if (callbackData === "Mindfulness") {
                strategyResponse = "Take a deep breath. Inhale for 4 seconds, hold for 4 seconds, and exhale for 4 seconds. Repeat. 🧘‍♂️";
            } else if (callbackData === "Exercise") {
                strategyResponse = "A quick 5-minute stretch can boost your mood. Try it now! 🏃‍♀️";
            } else {
                strategyResponse = "Write down 3 things you're grateful for today. Gratitude journaling helps shift your mindset. 📖✨";
            }

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [strategyResponse] } },
                    {
                        payload: {
                            telegram: {
                                text: "Want to try another coping strategy?",
                                reply_markup: {
                                    inline_keyboard: [[{ text: "🌱 More Strategies", callback_data: "Coping Strategies" }]],
                                },
                            },
                        },
                    },
                ],
            });
        }

        // Default Response
        return res.json({
            fulfillmentMessages: [{ text: { text: ["I didn’t quite get that. Can you try again?"] } }],
        });

    } catch (error) {
        console.error("Error:", error);
        return res.json({
            fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong."] } }],
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
