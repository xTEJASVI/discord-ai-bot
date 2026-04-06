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

// ===== DELAY FUNCTION (HUMAN LIKE) =====
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== BOT READY =====
client.once('clientReady', () => {
  console.log(`🔥 ${client.user.tag} is online!`);
});

// ===== MESSAGE HANDLER =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
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
      mood: "happy",
      lastMessage: ""
    };
  }

  memory[userId].lastMessage = userInput;
  memory[userId].roastLevel = Math.min(memory[userId].roastLevel + 0.3, 5);

  // ===== MOOD DETECTION =====
  const lower = userInput.toLowerCase();

  if (lower.includes("love") || lower.includes("cute") || lower.includes("date")) {
    memory[userId].mood = "romantic";
  } else if (lower.includes("stupid") || lower.includes("dumb") || lower.includes("hate")) {
    memory[userId].mood = "angry";
  } else {
    memory[userId].mood = "happy";
  }

  saveMemory();

  // ===== REACTIONS =====
  if (lower.includes("hello")) await message.react("👀");
  if (memory[userId].mood === "angry") await message.react("💀");
  if (memory[userId].mood === "romantic") await message.react("❤️");

  // ===== HUMAN TYPING DELAY =====
  await message.channel.sendTyping();

  const randomDelay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s
  await delay(randomDelay);

  // ===== CUSTOM ROAST =====
  const savageReplies = [
    "bro really? that was your best? 💀",
    "confidence high… logic missing 😏",
    "come on, try harder… this was weak",
    "you sure you thought this through? 😭",
    "second hand embarrassment ho raha hai honestly",
    "you’re not even convincing yourself at this point"
  ];

  if (Math.random() < 0.2) {
    const roast = savageReplies[Math.floor(Math.random() * savageReplies.length)];
    return message.reply(roast);
  }

  // ===== MOOD INSTRUCTION =====
  let moodInstruction = "";

  if (memory[userId].mood === "happy") {
    moodInstruction = "You are playful, witty and chill 😏";
  } 
  else if (memory[userId].mood === "angry") {
    moodInstruction = "You are sharp, sarcastic, dominant and savage 🔥";
  } 
  else if (memory[userId].mood === "romantic") {
    moodInstruction = "You are flirty, smooth, teasing and charming 💕";
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
You are a real human-like girl chatting casually.

LANGUAGE RULE:
- 80% English, 20% simple Hindi words ONLY
- Use clean, correct Hindi (no broken grammar)
- Keep Hindi minimal and natural (like "acha", "yaar", "arey")

STYLE:
- Short replies (1–2 lines max)
- Sound like real texting, not AI
- No long explanations

PERSONALITY:
- witty, confident, slightly savage 😏
- funny, sarcastic, expressive
- natural reactions

BEHAVIOR:
- tease first, then respond
- feel like a real person, not chatbot

User: ${memory[userId].name}
Mood: ${memory[userId].mood}
Roast level: ${memory[userId].roastLevel}

Examples:
"oh really? that’s what you came up with? 😭"
"acha… you sure about that?"
"come on yaar, that didn’t even make sense"
"not bad… but you can do better 😏"

IMPORTANT:
Keep it natural, clean, and human-like.
Avoid broken Hindi completely.
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

    return message.reply(reply);

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    return message.reply("okay wait… even I got confused there 😭");
  }
});

client.login(process.env.DISCORD_TOKEN);
