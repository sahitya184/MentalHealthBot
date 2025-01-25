const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const axios = require("axios"); // Import axios

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Mental Health Bot Webhook is running successfully!");
});

// Webhook route for Dialogflow
app.post("/webhook", async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;

  try {
    if (intentName === "Get Motivation") {
      // Fetch a quote from the API
      const response = await fetch("https://zenquotes.io/api/random");
      const data = await response.json();

      const quote = data[0]?.q || "Stay motivated!";
      const author = data[0]?.a || "Unknown";

      // Respond to Dialogflow
      return res.json({
        fulfillmentMessages: [
          {
            text: { text: [`"${quote}" - ${author}`] },
          },
        ],
      });
    }

    if (intentName === "Cheer Up") {
      // Fetching a random joke
      const jokeResponse = await axios.get("https://official-joke-api.appspot.com/jokes/random");
      const jokeSetup = jokeResponse.data.setup;
      const jokePunchline = jokeResponse.data.punchline;

      const cheerUpResponse = `Here's something to cheer you up: ${jokeSetup} ... ${jokePunchline}`;

      return res.json({
        fulfillmentMessages: [{ text: { text: [cheerUpResponse] } }],
      });
    }

    if (intentName === "Coping Strategies") {
      // Example coping strategies (static for now)
      const copingStrategies = [
        "Take deep breaths and count to 10 slowly.",
        "Write down your feelings in a journal.",
        "Go for a short walk outside.",
        "Talk to a trusted friend or family member.",
        "Listen to calming music or a guided meditation.",
      ];

      const randomStrategy = copingStrategies[Math.floor(Math.random() * copingStrategies.length)];

      return res.json({
        fulfillmentMessages: [{ text: { text: [randomStrategy] } }],
      });
    }

    // If no matching intent, send default response
    return res.json({
      fulfillmentMessages: [
        {
          text: { text: ["I didn't understand that."] },
        },
      ],
    });
  } catch (error) {
    console.error("Error:", error);
    return res.json({
      fulfillmentMessages: [
        {
          text: { text: ["Sorry, there was an error processing your request."] },
        },
      ],
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
