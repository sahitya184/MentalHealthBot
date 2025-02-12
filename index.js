const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const queryText = req.body.queryResult.queryText || "";
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || queryText;

    try {
        res.setHeader("Content-Type", "application/json");

        // Welcome Intent Response
        if (intentName === "Welcome Intent") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello there! 👋 Welcome to your safe space. 🌈"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "How can I help you today?",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "💪 Get Motivation", callback_data: "Get Motivation" }],
                                        [{ text: "😊 Cheer Up", callback_data: "Cheer Up" }],
                                        [{ text: "🌱 Coping Strategies", callback_data: "Coping Strategies" }]
                                    ],
                                },
                            },
                        },
                    },
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [
                                [{ type: "chips", options: [{ text: "💪 Get Motivation" }, { text: "😊 Cheer Up" }, { text: "🌱 Coping Strategies" }] }]
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
                const quoteData = response.data[0];
                const quote = quoteData.q || "Stay strong, you're doing great! 💪";
                const author = quoteData.a || "Unknown";

                return res.json({
                    fulfillmentMessages: [
                        { text: { text: [`"${quote}" – ${author}`] } },
                        {
                            platform: "PLATFORM_UNSPECIFIED",
                            payload: {
                                richContent: [[{ type: "chips", options: [{ text: "🔄 Another Quote" }] }]]
                            }
                        },
                        {
                            platform: "TELEGRAM",
                            payload: {
                                telegram: {
                                    text: "Want another quote?",
                                    reply_markup: {
                                        inline_keyboard: [[{ text: "🔄 Another Quote", callback_data: "Get Motivation" }]],
                                    },
                                },
                            },
                        }
                    ],
                });
            } catch (error) {
                console.error("Error fetching motivation:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Keep pushing forward! You're doing amazing. 💪"] } }] });
            }
        }

        // Cheer Up (Jokes)
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I’d love to make you smile! 😊 What kind of joke would you like?"] } },
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [[{ type: "chips", options: [{ text: "🤣 Random" }, { text: "😂 Pun" }, { text: "🤭 Knock-Knock" }] }]]
                        }
                    },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Choose a joke type:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🤣 Random", callback_data: "Random Joke" }],
                                        [{ text: "😂 Pun", callback_data: "Pun" }],
                                        [{ text: "🤭 Knock-Knock", callback_data: "Knock-Knock" }]
                                    ],
                                },
                            },
                        },
                    }
                ],
            });
        }

        return res.json({ fulfillmentMessages: [{ text: { text: ["I’m here to help! 😊"] } }] });

    } catch (error) {
        console.error("Error:", error);
        return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong."] } }] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
