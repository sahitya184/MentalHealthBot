const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    const callbackData = req.body.originalDetectIntentRequest?.payload?.data?.callback_query?.data || "";

    try {
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
                                [{ type: "chips", options: [{ text: "💪 Get Motivation" }, { text: "😊 Cheer Up" }, { text: "🌱 Coping Strategies" }] }]
                            ]
                        }
                    }
                ],
            });
        }

        // Get Motivation (Including "Another Quote")
        if (intentName === "Get Motivation" || callbackData === "Get Motivation") {
            const response = await fetch("https://zenquotes.io/api/random");
            const data = await response.json();
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
                            richContent: [[{ type: "chips", options: [{ text: "🔄 Another Quote" }] }]]
                        }
                    }
                ],
            });
        }

        // Cheer Up (Jokes)
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
                            richContent: [[{ type: "chips", options: [{ text: "🤣 Random" }, { text: "😂 Pun" }, { text: "🤭 Knock-Knock" }] }]]
                        }
                    }
                ],
            });
        }

        // Cheer Up - Type (Joke Selection)
        if (["Random Joke", "Pun", "Knock-Knock"].includes(callbackData)) {
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
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Want another joke?",
                                reply_markup: {
                                    inline_keyboard: [[{ text: "😂 Another One", callback_data: "Cheer Up" }]],
                                },
                            },
                        },
                    },
                    {
                        platform: "PLATFORM_UNSPECIFIED",
                        payload: {
                            richContent: [[{ type: "chips", options: [{ text: "😂 Another One" }] }]]
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
                                [{ type: "chips", options: [{ text: "🧘 Deep Breathing" }, { text: "✍️ Journaling" }, { text: "🎵 Listen to Music" }] }]
                            ]
                        }
                    }
                ],
            });
        }

        // Coping Strategies - Choice Handling
        if (["Deep Breathing", "Journaling", "Listen to Music"].includes(callbackData)) {
            const strategyResponses = {
                "Deep Breathing": "Try this: Inhale for 4 seconds, hold for 4 seconds, and exhale for 4 seconds. Repeat 5 times. 🧘‍♂️",
                "Journaling": "Write down three things you're grateful for today. It helps shift your focus to positivity! ✍️",
                "Listen to Music": "Put on your favorite song and take a moment to enjoy it. Music has a powerful effect on emotions! 🎵"
            };

            return res.json({
                fulfillmentMessages: [
                    { text: { text: [strategyResponses[callbackData]] } },
                    {
                        platform: "TELEGRAM",
                        payload: {
                            telegram: {
                                text: "Would you like to try another coping strategy?",
                                reply_markup: {
                                    inline_keyboard: [[{ text: "🔄 Another Strategy", callback_data: "Coping Strategies" }]],
                                },
                            },
                        },
                    }
                ],
            });
        }

        return res.json({ fulfillmentMessages: [{ text: { text: ["I didn’t quite get that. Can you try again?"] } }] });
    } catch (error) {
        console.error("Error:", error);
        return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! Something went wrong."] } }] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
