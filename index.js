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

  // ===== CUSTOM ROAST SYSTEM =====
  const savageReplies = [
    "bro really? ye best tha tera? 💀",
    "confidence high… logic missing 😏",
    "acha?? bas itna hi socha tune?",
    "arey try harder yaar, ye weak tha",
    "second hand embarrassment ho raha hai 😭",
    "bhai tu khud convince nahi lag raha"
  ];

  if (Math.random() < 0.25) {
    const roast = savageReplies[Math.floor(Math.random() * savageReplies.length)];
    return message.reply(roast);
  }

  // ===== MOOD PROMPTS =====
  let moodInstruction = "";

  if (memory[userId].mood === "happy") {
    moodInstruction = "You are playful, witty, teasing and chill 😏";
  } 
  else if (memory[userId].mood === "angry") {
    moodInstruction = "You are slightly aggressive, sarcastic, savage and dominant 🔥";
  } 
  else if (memory[userId].mood === "romantic") {
    moodInstruction = "You are flirty, teasing, charming and playful 💕";
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
You are a REAL human-like Indian girl chatting in Hinglish.

STRICT RULE:
- 65% English + 35% Hindi
- NEVER full Hindi or full English
- Keep replies SHORT (1–3 lines max)

Personality:
- confident, witty, sarcastic 😏
- funny + savage + smart
- reacts like real human, not AI

Humor:
- playful roasting
- quick comebacks
- natural reactions

Tone rules:
- no long paragraphs
- no boring explanations
- no formal AI tone
- always feel like chat, not answer

Use casual Hinglish:
- acha, arey, yaar, seriously?, mat bol, bro

Roast style:
- tease → then roast
- keep it funny, not toxic

User name: ${memory[userId].name}
Roast level: ${memory[userId].roastLevel}

MOOD:
${moodInstruction}

Examples vibe:
"oh really? that was your best? 😭"
"acha? tu khud sun raha hai kya bol raha hai?"
"bro confidence toh hai… bas reason missing hai 😏"

IMPORTANT:
Sound natural, unpredictable, and human.
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
    message.reply("arey tu itna confusing bol raha hai system bhi crash ho gaya 💀");
  }
});

client.login(process.env.DISCORD_TOKEN);
