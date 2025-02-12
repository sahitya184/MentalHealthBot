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
        res.setHeader("Content-Type", "application/json"); // Ensure proper content type

        console.log("Received Intent:", intentName);
        console.log("Callback Data:", callbackData);

        // 🏡 Welcome Intent
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
                                        [{ text: "🌱 Coping Strategies", callback_data: "Coping Strategies" }]
                                    ]
                                }
                            }
                        }
                    },
                    {
                        payload: {
                            richContent: [
                                [
                                    { type: "suggestion", text: "💪 Get Motivation" },
                                    { type: "suggestion", text: "😊 Cheer Up" },
                                    { type: "suggestion", text: "🌱 Coping Strategies" }
                                ]
                            ]
                        }
                    }
                ]
            });
        }

        // 💪 Get Motivation Intent
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
                            payload: {
                                telegram: {
                                    text: "Would you like another quote?",
                                    reply_markup: {
                                        inline_keyboard: [[{ text: "🔄 Another Quote", callback_data: "Get Motivation" }]]
                                    }
                                }
                            }
                        },
                        {
                            payload: {
                                richContent: [[{ type: "suggestion", text: "🔄 Another Quote" }]]
                            }
                        }
                    ]
                });
            } catch (error) {
                console.error("Error fetching motivation quote:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Keep pushing forward! You're doing amazing. 💪"] } }] });
            }
        }

        // 😊 Cheer Up (Jokes)
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
                                        [{ text: "🤭 Knock-Knock", callback_data: "Knock-Knock" }]
                                    ]
                                }
                            }
                        }
                    },
                    {
                        payload: {
                            richContent: [
                                [
                                    { type: "suggestion", text: "🤣 Random" },
                                    { type: "suggestion", text: "😂 Pun" },
                                    { type: "suggestion", text: "🤭 Knock-Knock" }
                                ]
                            ]
                        }
                    }
                ]
            });
        }

        // 🎭 Joke Type Selection
        if (["Random Joke", "Pun", "Knock-Knock"].includes(callbackData)) {
            let jokeResponse;
            try {
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
                                        inline_keyboard: [[{ text: "😂 Another One", callback_data: "Cheer Up" }]]
                                    }
                                }
                            }
                        },
                        {
                            payload: {
                                richContent: [[{ type: "suggestion", text: "😂 Another One" }]]
                            }
                        }
                    ]
                });
            } catch (error) {
                console.error("Error fetching joke:", error);
                return res.json({ fulfillmentMessages: [{ text: { text: ["Oops! I couldn't fetch a joke, but I'm still here to cheer you up! 😊"] } }] });
            }
        }

        // 🌱 Coping Strategies
        if (intentName === "Coping Strategies" || callbackData === "Coping Strategies") {
            return res.json({
                fulfillmentMessages: [
                    { text: { text: ["Here are some ways to cope with stress. Which one would you like to try?"] } },
                    {
                        payload: {
                            telegram: {
                                text: "Select a coping strategy:",
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: "🧘 Deep Breathing", callback_data: "Deep Breathing" }],
                                        [{ text: "✍️ Journaling", callback_data: "Journaling" }],
                                        [{ text: "🎵 Listen to Music", callback_data: "Listen to Music" }]
                                    ]
                                }
                            }
                        }
                    },
                    {
                        payload: {
                            richContent: [
                                [
                                    { type: "suggestion", text: "🧘 Deep Breathing" },
                                    { type: "suggestion", text: "✍️ Journaling" },
                                    { type: "suggestion", text: "🎵 Listen to Music" }
                                ]
                            ]
                        }
                    }
                ]
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
