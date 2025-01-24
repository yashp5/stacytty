import tmi from "tmi.js";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Deepseek API setup
const configuration = new Configuration({
  apiKey: process.env.DEEPSEEK_API_KEY,
  basePath: "https://api.deepseek.com/v1",
});
const deepseekApi = new OpenAIApi(configuration);

// Twitch bot configuration
const TWITCH_USERNAME = process.env.TWITCH_USERNAME;
const TWITCH_OAUTH_TOKEN = process.env.TWITCH_OAUTH_TOKEN;
const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;

// Create Twitch client
const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: TWITCH_USERNAME,
    password: TWITCH_OAUTH_TOKEN,
  },
  channels: [TWITCH_CHANNEL!],
});

// Function to fetch response from Deepseek
async function getResponseFromLLM(userMessage: string): Promise<string> {
  try {
    const response = await deepseekApi.createChatCompletion({
      model: "deepseek-chat", // Using Deepseek-V3
      messages: [
        {
          role: "system",
          content: "You are a friendly Twitch chat assistant.",
        },
        { role: "user", content: userMessage },
      ],
    });

    return (
      response.data.choices[0].message?.content ||
      "Sorry, I couldn't generate a response."
    );
  } catch (error) {
    console.error("Error fetching response from Deepseek:", error);
    return "Oops! Something went wrong.";
  }
}

// Event listener: on message
client.on("message", async (channel, tags, message, self) => {
  if (self) return; // Ignore bot's own messages

  console.log(`Message from ${tags["display-name"]}: ${message}`);

  // Generate a response using Deepseek
  const response = await getResponseFromLLM(message);

  // Send response back to the Twitch chat
  client.say(channel, `@${tags["display-name"]} ${response}`);
});

// Connect to Twitch
client.connect().catch(console.error);

console.log(`Twitch bot connected to channel: ${TWITCH_CHANNEL}`);
