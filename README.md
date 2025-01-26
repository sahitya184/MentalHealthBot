# Mental Health Support Chatbot

This repository contains the complete source code and configuration files for the **Mental Health Support Chatbot**, designed to provide users with motivational quotes, jokes, and coping strategies. The bot is integrated with Telegram and uses Dialogflow for intent recognition and webhook fulfillment for dynamic responses.

## Features

- **Dynamic Responses via Webhook**: Fetches live data for motivational quotes and jokes.
- **Dialogflow Agent**: Handles user intents such as "Get Motivation," "Cheer Up," and "Coping Strategies."
- **Telegram Integration**: Allows users to interact with the bot via Telegram.

## Prerequisites

1. **Node.js** (for webhook server): Ensure you have Node.js installed.
2. **Dialogflow**: Google Cloud project configured with Dialogflow.
3. **Telegram**: Telegram bot created using BotFather.

## Setup Instructions

### **Step 1: Clone the Repository**

git clone <repository-url>
cd mental-health-bot

### **Step 2: Setup Webhook**

1. Navigate to the `webhook/` directory:
   cd webhook
 
2. Install dependencies:
   npm install
  
3. Start the server:
   node index.js
  

### **Step 3: Deploy Webhook**

1. Deploy the webhook code to a hosting service like **Render**, **Google Cloud**, or **Heroku**.
2. Copy the deployed URL and set it as the **fulfillment webhook** in Dialogflow.

### **Step 4: Import Dialogflow Agent**

1. Go to the [Dialogflow Console](https://dialogflow.cloud.google.com/).
2. Select your project and navigate to the **Settings** > **Export and Import** tab.
3. Import the `dialogflow/` folder as a ZIP file.

### **Step 5: Telegram Integration**

1. Use the Telegram **BotFather** to create a new bot and get the token.
2. Add the Telegram API token in the webhook code (if applicable).

## Testing the Bot

### **Telegram**

1. Open Telegram and search for your bot by its username.
2. Interact with the bot using the following commands:
   - "Get Motivation": Fetches a motivational quote.
   - "Cheer Up": Sends a random joke.
   - "Coping Strategies": Provides a random coping strategy.

### **Dialogflow Console**

1. Test intents directly in the Dialogflow Console.
2. Check fulfillment responses returned by the webhook.

## Future Improvements

- Add more intents and dynamic responses.
- Integrate with additional platforms like Slack or WhatsApp.
- Enable sentiment analysis for personalized responses.  

For any issues or inquiries, feel free to open an issue in this repository or contact me directly.

