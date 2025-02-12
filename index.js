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

        // 🎉 Welcome Intent
        if (intentName === "Welcome Intent") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hey there! 😊 I'm here to support you. How are you feeling today?"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Let me know how I can help you today! 💙",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "💪 I need motivation", callback_data: "Get Motivation" }],
                                        [{ text: "😊 I want to cheer up", callback_data: "Cheer Up" }],
                                        [{ text: "🌱 I need coping strategies", callback_data: "Coping Strategies" }]
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
                                    {
                                        type: "chips",
                                        options: [
                                            { text: "💪 I need motivation" },
                                            { text: "😊 I want to cheer up" },
                                            { text: "🌱 I need coping strategies" }
                                        ]
                                    }
                                ]
                            ]
                        }
                    }
                ],
            });
        }

        // 💪 Get Motivation
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            try {
                const response = await axios.get("https://zenquotes.io/api/random");
                const quoteData = response.data[0];
                const quote = quoteData.q || "You're stronger than you think! 💪";
                const author = quoteData.a || "Unknown";

                return res.json({
                    fulfillmentMessages: [
                        { text: { text: [`I hear you! Here’s some motivation for you: \n\n"${quote}" – ${author}`] } },
                        {
                            platform: "TELEGRAM",
                            payload: {
                                telegram: {
                                    text: "Would you like another quote? 💙",
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
                                    [
                                        {
                                            type: "chips",
                                            options: [{ text: "🔄 Another Quote" }]
                                        }
                                    ]
                                ]
                            }
                        }
                    ],
                });
            } catch (error) {
                console.error("Error fetching motivation:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["You're amazing just the way you are! 💖"] } }] });
            }
        }

        // 😊 Cheer Up (Jokes)
        if (intentName === "Cheer Up" || callbackData === "Cheer Up") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["I’d love to make you smile! 😊 What kind of joke do you like?"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Pick a type of joke! 😆",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🤣 Random", callback_data: "Random Joke" }],
                                        [{ text: "😂 Pun", callback_data: "Pun" }],
                                        [{ text: "🤭 Knock-Knock", callback_data: "Knock-Knock" }]
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
                                    {
                                        type: "chips",
                                        options: [
                                            { text: "🤣 Random" },
                                            { text: "😂 Pun" },
                                            { text: "🤭 Knock-Knock" }
                                        ]
                                    }
                                ]
                            ]
                        }
                    }
                ],
            });
        }

        // Default Fallback
        return res.json({ fulfillmentMessages: [{ text: { text: ["I'm here for you. Let me know what you need. 💙"] } }] });

    } catch (error) {
        console.error("Error:", error);
        return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong."] } }] });
    }
});

// 🌍 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
