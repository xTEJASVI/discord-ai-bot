require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== MEMORY SYSTEM =====
const memoryFile = "memory.json";
let memory = {};

if (fs.existsSync(memoryFile)) {
  memory = JSON.parse(fs.readFileSync(memoryFile));
}

function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// ===== BOT READY =====
client.once('clientReady', () => {
  console.log(`🔥 ${client.user.tag} is online!`);
});

// ===== MESSAGE HANDLER =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // only reply if mentioned
  if (!message.mentions.has(client.user)) return;

  const userInput = message.content.replace(/<@!?\\d+>/, "").trim();
  if (!userInput) return;

  const userId = message.author.id;
  const username = message.author.username;

  // ===== MEMORY INIT =====
  if (!memory[userId]) {
    memory[userId] = {
      name: username,
      roastLevel: 1,
      lastMessage: ""
    };
  }

  memory[userId].lastMessage = userInput;
  memory[userId].roastLevel = Math.min(memory[userId].roastLevel + 0.3, 5);
  saveMemory();

  // ===== REACTION SYSTEM =====
  const lower = userInput.toLowerCase();

  if (lower.includes("hello")) await message.react("👀");
  if (lower.includes("dumb") || lower.includes("stupid")) await message.react("💀");
  if (userInput.includes("?")) await message.react("🤨");

  // ===== CUSTOM ROAST SYSTEM =====
  const savageReplies = [
    "arey bhai tu khud samajh raha hai kya bol raha hai 💀",
    "itna confidence galat hone mein bhi talent hai 😭",
    "acha?? bas itna hi tha? thoda aur try kar na 😏",
    "ye argument hai ya timepass chal raha hai?",
    "mat bol yaar… second hand embarrassment ho raha hai 🔥",
    "tu serious hai ya mazak chal raha hai?",
    "bhai tu debate nahi kar raha, bas hawa mein bol raha hai"
  ];

  // 30% chance instant roast
  if (Math.random() < 0.3) {
    const roast = savageReplies[Math.floor(Math.random() * savageReplies.length)];
    return message.reply(roast);
  }

  // ===== AI RESPONSE =====
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        temperature: 1,
        top_p: 0.9,
        messages: [
          {
            role: "system",
            content: `
You are a savage, funny Indian girl who speaks in natural Hinglish.

User name: ${memory[userId].name}
Roast level: ${memory[userId].roastLevel}

You talk like a real desi person, not AI.

Style:
- Hinglish only (Hindi + English mix)
- Short punchy replies
- Funny + savage + sarcastic
- Use words like: arey, acha, bhai, yaar, mat bol

Behavior:
- Tease first, then roast
- Act amused or unimpressed 😏
- React like a real person

Examples:
"acha?? itna confidence kis baat ka hai 😏"
"arey tu khud sun raha hai kya bol raha hai 💀"
"bhai ye argument hai ya bas hawa mein bol raha hai?"

Adjust intensity based on roast level (higher = more savage).
            `
          },
          {
            role: "user",
            content: userInput
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content;

    message.reply(reply);

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    message.reply("arey system bhi confuse ho gaya tere sawaal se 💀");
  }
});

client.login(process.env.DISCORD_TOKEN);