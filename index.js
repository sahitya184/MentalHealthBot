const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    const queryText = req.body.queryResult.queryText || "";
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || queryText;

    try {
        res.setHeader("Content-Type", "application/json");

        // Welcome Intent
        if (intentName === "Welcome Intent") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello there! 👋 Welcome to your safe space. 🌈\n\nI’m here to support you. What would you like to explore?"] } },
                    {
                        platform: "TELEGRAM",
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
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [
                                [
                                    { "type": "button", "text": "💪 Get Motivation", "event": { "name": "Get Motivation" } },
                                    { "type": "button", "text": "😊 Cheer Up", "event": { "name": "Cheer Up" } },
                                    { "type": "button", "text": "🌱 Coping Strategies", "event": { "name": "Coping Strategies" } }
                                ]
                            ]
                        }
                    }
                ],
            });
        }

        // Get Motivation
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            try {
                const response = await axios.get("https://zenquotes.io/api/random");
                const data = response.data;
                const quote = data[0]?.q || "Stay strong, you're doing great! 💪";
                const author = data[0]?.a || "Unknown";

                return res.json({
                    fulfillmentMessages: [
                        { text: { text: [`"${quote}" – ${author}`] } },
                        {
                            platform: "TELEGRAM",
                            payload: {
                                telegram: {
                                    text: "Would you like another quote?",
                                    reply_markup: {
                                        inline_keyboard: [[{ text: "🔄 Another Quote", callback_data: "Get Motivation" }]],
                                    },
                                },
                            },
                        },
                        {
                            platform: "PLATFORM_UNSPECIFIED",
                            payload: {
                                richContent: [
                                    [{ "type": "button", "text": "🔄 Another Quote", "event": { "name": "Get Motivation" } }]
                                ]
                            }
                        }
                    ],
                });
            } catch (error) {
                console.error("Error fetching motivation quote:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Keep pushing forward! You're doing amazing. 💪"] } }] });
            }
        }

        // Cheer Up
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I’d love to make you smile! 😊 What kind of joke would you like?"] } },
                    {
                        platform: "TELEGRAM",
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
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [
                                [
                                    { "type": "button", "text": "🤣 Random", "event": { "name": "Random Joke" } },
                                    { "type": "button", "text": "😂 Pun", "event": { "name": "Pun" } },
                                    { "type": "button", "text": "🤭 Knock-Knock", "event": { "name": "Knock-Knock" } }
                                ]
                            ]
                        }
                    }
                ],
            });
        }

        // Coping Strategies
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Here are some ways to cope with stress. Which one would you like to try?"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Select a coping strategy:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🧘 Deep Breathing", callback_data: "Deep Breathing" }],
                                        [{ text: "✍️ Journaling", callback_data: "Journaling" }],
                                        [{ text: "🎵 Listen to Music", callback_data: "Listen to Music" }],
                                    ],
                                },
                            },
                        },
                    },
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [
                                [
                                    { "type": "button", "text": "🧘 Deep Breathing", "event": { "name": "Deep Breathing" } },
                                    { "type": "button", "text": "✍️ Journaling", "event": { "name": "Journaling" } },
                                    { "type": "button", "text": "🎵 Listen to Music", "event": { "name": "Listen to Music" } }
                                ]
                            ]
                        }
                    }
                ],
            });
        }

        return res.json({ fulfillmentMessages: [{ text: { text: ["I’m here to help! Try saying 'Get Motivation', 'Cheer Up', or 'Coping Strategies'. 😊"] } }] });

    } catch (error) {
        console.error("Error:", error);
        return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong."] } }] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
