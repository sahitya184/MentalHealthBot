const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const axios = require("axios");
const admin = require("firebase-admin"); // Import Firebase Admin SDK

// Initialize Firebase Admin SDK (Make sure you have Firebase credentials)
admin.initializeApp();

const app = express();
app.use(bodyParser.json());

// Middleware for Firebase Authentication
const authenticateRequest = async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach decoded user data to the request object
    next(); // Continue to the next middleware/route
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Webhook route for Dialogflow
app.post("/webhook", authenticateRequest, async (req, res) => {
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
      try {
        // Capture user profile details from the request
        const userName = req.body.queryResult.parameters.userName || "Unknown";
        const userAge = req.body.queryResult.parameters.userAge || null;
        const userPreferences = req.body.queryResult.parameters.userPreferences || "No preferences specified";
        const userId = req.body.session.split("/").pop(); // Extract user ID from session
    
        // Construct the user profile object
        const userProfile = {
          name: userName,
          age: userAge,
          preferences: userPreferences,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
    
        // Ensure no undefined values are passed to Firestore
        Object.keys(userProfile).forEach((key) => {
          if (userProfile[key] === undefined) {
            delete userProfile[key];
          }
        });
    
        // Save user profile data to Firestore
        await admin.firestore().collection("users").doc(userId).set(userProfile);
    
        // Respond to Dialogflow
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
      } catch (error) {
        console.error("Error capturing profile:", error.message);
    
        // Error response for Dialogflow
        return res.json({
          fulfillmentMessages: [
            {
              text: {
                text: [
                  "Sorry, there was an error updating your profile. Please try again later.",
                ],
              },
            },
          ],
        });
      }
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
