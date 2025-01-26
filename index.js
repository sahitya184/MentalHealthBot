const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const axios = require("axios");
const admin = require("firebase-admin"); // Import Firebase Admin SDK

// Initialize Firebase Admin SDK (Make sure you have the credentials JSON file)
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Update if necessary
  databaseURL: "https://myfirstproject-cccc5.firebaseio.com" // Replace with your Firebase DB URL
});

const app = express();
app.use(bodyParser.json());

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

    if (intentName === "Log Mood") {
      // Capture user mood and log it in Firebase
      const userMood = req.body.queryResult.parameters.mood;
      const userId = req.body.session; // Assuming session ID as user ID

      // Log the mood to Firestore
      await admin.firestore().collection("moods").doc(userId).set({
        mood: userMood,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        fulfillmentMessages: [
          {
            text: { text: [`Your mood, '${userMood}', has been logged.`] },
          },
        ],
      });
    }

    if (intentName === "Capture Profile") {
      // Capture user profile and save to Firebase
      const userName = req.body.queryResult.parameters.userName;
      const userAge = req.body.queryResult.parameters.userAge;
      const userPreferences = req.body.queryResult.parameters.userPreferences;
      const userId = req.body.session; // Assuming session ID as user ID

      // Save user profile data to Firestore
      await admin.firestore().collection("users").doc(userId).set({
        name: userName,
        age: userAge,
        preferences: userPreferences,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `Your profile has been updated. Name: ${userName}, Age: ${userAge}, Preferences: ${userPreferences}.`,
              ],
            },
          },
        ],
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
