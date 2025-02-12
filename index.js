const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Function to send responses for both Dialogflow & Telegram
const sendResponse = (res, text, buttons = null) => {
  let messages = [{ text: { text: [text] } }];

  // If buttons are provided, send as custom payload
  if (buttons) {
    messages.push({
      payload: {
        telegram: {
          reply_markup: {
            inline_keyboard: [buttons.map((btn) => ({ text: btn.label, callback_data: btn.data }))],
          },
        },
        richContent: [
          [
            {
              type: "chips",
              options: buttons.map((btn) => ({ text: btn.label, link: "" })),
            },
          ],
        ],
      },
    });
  }

  return res.json({ fulfillmentMessages: messages });
};

// Webhook route
app.post("/webhook", async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;

  try {
    // **Welcome Intent**
    if (intentName === "Default Welcome Intent") {
      return sendResponse(res, 
        "Hello there! 👋 Welcome to your safe space. I’m here to help you feel supported, uplifted, and ready to take on anything. 🌈\n\nWhat would you like to explore right now?",
        [
          { label: "💪 Get Motivation", data: "get_motivation" },
          { label: "😊 Cheer Up", data: "cheer_up" },
          { label: "🌱 Coping Strategies", data: "coping_strategies" },
        ]
      );
    }

    // **Get Motivation**
    if (intentName === "Get Motivation") {
      return sendResponse(res, 
        "I’d love to uplift you! What kind of motivation do you need today?", 
        [
          { label: "🏆 Success", data: "motivation_success" },
          { label: "💪 Resilience", data: "motivation_resilience" },
          { label: "✨ Positivity", data: "motivation_positivity" },
        ]
      );
    }

    // **Get Motivation - Choice**
    if (intentName === "Get Motivation - Choice") {
      const choice = req.body.queryResult.parameters.motivation_type;

      const motivationCategories = {
        success: "https://api.quotable.io/random?tags=success",
        resilience: "https://api.quotable.io/random?tags=wisdom",
        positivity: "https://api.quotable.io/random?tags=happiness",
      };

      const apiUrl = motivationCategories[choice] || "https://api.quotable.io/random";
      const response = await axios.get(apiUrl);
      const quote = response.data.content || "Stay motivated!";
      const author = response.data.author || "Unknown";

      return sendResponse(res, `"${quote}" - ${author}`);
    }

    // **Cheer Up**
    if (intentName === "Cheer Up") {
      return sendResponse(res, 
        "I'm here to make you smile! What type of joke do you prefer?", 
        [
          { label: "🤣 Pun", data: "joke_pun" },
          { label: "😂 Knock-Knock", data: "joke_knock_knock" },
          { label: "😆 Random", data: "joke_random" },
        ]
      );
    }

    // **Cheer Up - Type**
    if (intentName === "Cheer Up - Type") {
      const jokeType = req.body.queryResult.parameters.joke_type;
      let apiUrl = "https://official-joke-api.appspot.com/jokes/random";

      if (jokeType === "pun") {
        apiUrl = "https://official-joke-api.appspot.com/jokes/pun/random";
      } else if (jokeType === "knock-knock") {
        apiUrl = "https://official-joke-api.appspot.com/jokes/knock-knock/random";
      }

      const jokeResponse = await axios.get(apiUrl);
      const joke = jokeResponse.data[0] || jokeResponse.data;
      const jokeText = joke.setup ? `${joke.setup} ... ${joke.punchline}` : joke.joke;

      return sendResponse(res, `Here's something to cheer you up: ${jokeText}`);
    }

    // **Coping Strategies**
    if (intentName === "Coping Strategies") {
      return sendResponse(res, 
        "I’m here to help. What kind of coping strategy would you like?", 
        [
          { label: "🧘 Mindfulness", data: "coping_mindfulness" },
          { label: "🏃 Exercise", data: "coping_exercise" },
          { label: "🎶 Relaxation", data: "coping_relaxation" },
        ]
      );
    }

    // **Coping Strategies - Choice**
    if (intentName === "Coping Strategies - Choice") {
      const choice = req.body.queryResult.parameters.coping_type;

      const copingStrategies = {
        mindfulness: "Try this: Close your eyes, take a deep breath, and focus on the present moment. 🌿",
        exercise: "Try going for a short walk or stretching. Movement helps release stress! 🏃‍♂️",
        relaxation: "Listen to calming music or practice deep breathing. 🎶",
      };

      return sendResponse(res, copingStrategies[choice] || "Stay strong! You're doing great. 💙");
    }

    // Default Response
    return sendResponse(res, "I didn't quite get that. Can you rephrase?");
  } catch (error) {
    console.error("Error:", error);
    return sendResponse(res, "Sorry, there was an error processing your request.");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
