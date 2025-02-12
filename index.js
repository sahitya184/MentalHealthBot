const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || "";
    
    console.log("Received Intent:", intentName);
    console.log("Received Callback Data:", callbackData);

    try {
        res.setHeader("Content-Type", "application/json");

        // Welcome Intent (Main Menu)
        if (intentName === "Welcome Intent") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Hello there! 👋 I'm your Mental Health Support Bot. 💙"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "How can I help you today? 😊",
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

        // Get Motivation
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            try {
                const response = await axios.get("https://zenquotes.io/api/random");
                const quoteData = response.data[0];
                const quote = quoteData.q || "You’re stronger than you think! Keep going. 💪";
                const author = quoteData.a || "Unknown";

                return res.json({
                    fulfillmentMessages: [
                        { text: { text: [`"${quote}" – ${author}`] } },
                        {
                            platform: "TELEGRAM",
                            payload: {
                                telegram: {
                                    text: `"${quote}" – ${author}`,
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: "🔄 Get Another", callback_data: "Get Motivation" }],
                                            [{ text: "❌ End Chat", callback_data: "End Chat" }]
                                        ]
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
                                            [{ text: "❌ End Chat", callback_data: "End Chat" }]
                                        ]
                                    },
                                },
                            },
                        }
                    ],
                });
            } catch (error) {
                console.error("Error fetching joke:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Laughter is the best medicine! Here's a smile for you. 😊"] } }] });
            }
        }

        // Coping Strategies
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            const strategies = [
                "Take deep breaths and count to 10. 🧘‍♀️",
                "Go for a short walk outside. 🌿",
                "Write down your thoughts in a journal. ✍️",
                "Listen to your favorite calming music. 🎵",
                "Talk to someone you trust. 💙",
                "Try a short meditation session. 🧘",
                "Drink a glass of water and take a deep breath. 💧"
            ];

            const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [randomStrategy] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: randomStrategy,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🌱 Another Tip", callback_data: "Coping Strategies" }],
                                        [{ text: "❌ End Chat", callback_data: "End Chat" }]
                                    ]
                                },
                            },
                        },
                    }
                ],
            });
        }

        // Back to Menu (Modified: Now Shows Restart Instructions)
        if (callbackData === "Back to Menu") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["If you'd like to start over, just type *'start'* in the chat! 😊"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "To restart the chat, type *'start'*. I'm always here to help! 💙",
                            },
                        },
                    }
                ],
            });
        }

        // End Chat (Modified: Now Shows End Message)
        if (callbackData === "End Chat") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Chat ended. If you need support again, just type *'start'* to begin a new conversation. 💙"] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Chat ended. If you need support again, just type *'start'* anytime. Take care! 💙",
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
