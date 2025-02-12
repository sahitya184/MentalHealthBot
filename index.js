const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    console.log(`Received intent: ${intentName}`);

    try {
        // Welcome Intent
        if (intentName === "Welcome Intent") {
            console.log("Handling Welcome Intent...");
            return res.json({
                fulfillmentMessages: [
                    {
                        text: {
                            text: [
                                "Hello there! 👋 Welcome to your safe space. 🌈\n\nI’m here to help you feel supported, uplifted, and ready to take on anything. \n\nWhat would you like to explore right now?",
                            ],
                        },
                    },
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
        if (intentName === "Get Motivation") {
            console.log("Fetching motivation quote...");
            try {
                const response = await axios.get("https://zenquotes.io/api/random", { timeout: 4000 });
                const data = response.data;
                const quote = data[0]?.q || "Stay strong, you're doing great! 💪";
                const author = data[0]?.a || "Unknown";

                return res.json({
                    fulfillmentMessages: [
                        {
                            text: {
                                text: [
                                    `I hear you. We all have tough days, but you're stronger than you think. 💙\n\nHere's something to lift your spirits:\n\n"${quote}" – ${author}`,
                                ],
                            },
                        },
                        {
                            payload: {
                                telegram: {
                                    text: "Would you like another quote?",
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: "🔄 Another Quote", callback_data: "Get Motivation" }],
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                });
            } catch (error) {
                console.error("Error fetching quote:", error.message);
                return res.json({
                    fulfillmentMessages: [
                        { text: { text: ["Oops! Couldn't fetch a quote right now. Try again later!"] } },
                    ],
                });
            }
        }

        // Cheer Up (Jokes)
        if (intentName === "Cheer Up") {
            console.log("Handling Cheer Up Intent...");
            return res.json({
                fulfillmentMessages: [
                    {
                        text: {
                            text: ["I’d love to make you smile! 😊 What kind of joke would you like?"],
                        },
                    },
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

        // Cheer Up - Joke Type Selection
        if (intentName === "cheer up - type") {
            const jokeType = req.body.queryResult.parameters.joke_type || "Random";
            console.log(`Fetching joke of type: ${jokeType}`);

            try {
                let jokeResponse;
                if (jokeType === "Pun") {
                    jokeResponse = "I’m reading a book on anti-gravity… It’s impossible to put down! 😂";
                } else if (jokeType === "Knock-Knock") {
                    jokeResponse = "Knock, knock. \nWho's there? \nOlive. \nOlive who? \nOlive you and I miss you! ❤️";
                } else {
                    const jokeAPI = await axios.get("https://official-joke-api.appspot.com/jokes/random", { timeout: 4000 });
                    jokeResponse = `${jokeAPI.data.setup} ... ${jokeAPI.data.punchline}`;
                }

                return res.json({
                    fulfillmentMessages: [
                        {
                            text: { text: [jokeResponse] },
                        },
                        {
                            payload: {
                                telegram: {
                                    text: "Want another joke?",
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: "😂 Another One", callback_data: "Cheer Up" }],
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                });
            } catch (error) {
                console.error("Error fetching joke:", error.message);
                return res.json({
                    fulfillmentMessages: [
                        { text: { text: ["Oops! Couldn't fetch a joke right now. Try again later!"] } },
                    ],
                });
            }
        }

        // Coping Strategies
        if (intentName === "Coping Strategies") {
            console.log("Handling Coping Strategies Intent...");
            return res.json({
                fulfillmentMessages: [
                    {
                        text: {
                            text: ["Coping strategies can help you manage stress better. What type of strategy would you like?"],
                        },
                    },
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

        // Default Fallback
        console.log("Fallback Intent Triggered.");
        return res.json({
            fulfillmentMessages: [{ text: { text: ["I didn’t quite get that. Can you try again?"] } }],
        });

    } catch (error) {
        console.error("Unexpected Error:", error.message);
        return res.json({
            fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong. Please try again."] } }],
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
