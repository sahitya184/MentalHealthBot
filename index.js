const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Mental Health Bot Webhook is running successfully!");
});


// Webhook route for Dialogflow
app.post("/webhook", async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;

  if (intentName === "Get Motivation") {
    try {
      // Fetch a quote from the API
      const response = await fetch("https://zenquotes.io/api/random");
      const data = await response.json();

      const quote = data[0]?.q || "Stay motivated!";
      const author = data[0]?.a || "Unknown";

      // Respond to Dialogflow
      res.json({
        fulfillmentMessages: [
          {
            text: { text: [`"${quote}" - ${author}`] },
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.json({
        fulfillmentMessages: [
          {
            text: { text: ["Sorry, I couldn't fetch a quote at this time."] },
          },
        ],
      });
    }
  } else {
    res.json({
      fulfillmentMessages: [
        {
          text: { text: ["I didn't understand that."] },
        },
      ],
    });
  }
  if (intentName === 'Cheer Up') {
    try {
        // Fetching a random joke
        const jokeResponse = await axios.get('https://official-joke-api.appspot.com/jokes/random');
        const jokeSetup = jokeResponse.data.setup;
        const jokePunchline = jokeResponse.data.punchline;

        // Bot's response
        const cheerUpResponse = `Here's something to cheer you up: ${jokeSetup} ... ${jokePunchline}`;

        res.json({
            fulfillmentMessages: [{ text: { text: [cheerUpResponse] } }]
        });
    } catch (error) {
        console.error(error);
        res.json({
            fulfillmentMessages: [{ text: { text: ["Sorry, I couldn't fetch anything to cheer you up right now."] } }]
        });
    }
}

if (intentName === 'Coping Strategies') {
  try {
      // Example coping strategies (static for now)
      const copingStrategies = [
          "Take deep breaths and count to 10 slowly.",
          "Write down your feelings in a journal.",
          "Go for a short walk outside.",
          "Talk to a trusted friend or family member.",
          "Listen to calming music or a guided meditation."
      ];

      // Randomly select a strategy
      const randomStrategy = copingStrategies[Math.floor(Math.random() * copingStrategies.length)];

      res.json({
          fulfillmentMessages: [{ text: { text: [randomStrategy] } }]
      });
  } catch (error) {
      console.error(error);
      res.json({
          fulfillmentMessages: [{ text: { text: ["Sorry, I couldn't fetch a coping strategy right now."] } }]
      });
  }
}


});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
