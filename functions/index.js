const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.logMood = functions.https.onRequest((req, res) => {
  const userMood = req.body.queryResult.parameters.userMood;  // Capture mood from Dialogflow
  const userId = req.body.session;  // Use session ID as user ID

  // Save mood to Firestore under 'moods' collection
  admin.firestore().collection('moods').add({
    userId: userId,
    mood: userMood,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    res.json({
      fulfillmentText: `Your mood, "${userMood}", has been logged. Would you like to track your mood over time?`,
    });
  }).catch((error) => {
    res.json({
      fulfillmentText: `Sorry, there was an issue logging your mood.`,
    });
  });
});
