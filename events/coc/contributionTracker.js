const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { clanTag, clashApiToken } = require('../../config');

// -----------------------
// PATHS + setup
// -----------------------

const DATA_PATH = path.join(__dirname, '../../data/contributions.json');
const MEMBERS_PATH = path.join(__dirname, '../../data/members.json');

const API_HEADERS = { Authorization: `Bearer ${clashApiToken}` };

// -----------------------
// JSON HANDLING SAFE
// -----------------------

function safeLoad(path, initial) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const raw = fs.readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    console.warn(`[WARN] Fichier corrompu : ${path} → réinitialisation.`);
    fs.writeFileSync(path, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function save(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function loadData() {
  return safeLoad(DATA_PATH, {});
}

function saveData(data) {
  save(DATA_PATH, data);
}

function loadMembers() {
  return safeLoad(MEMBERS_PATH, {});
}

function saveMembers(data) {
  save(MEMBERS_PATH, data);
}

// -----------------------
// API CLASH OF CLANS
// -----------------------

async function fetchClanMembers() {
  const encodedTag = encodeURIComponent(clanTag);
  const res = await axios.get(
    `https://api.clashofclans.com/v1/clans/${encodedTag}/members`,
    { headers: API_HEADERS }
  );
  return res.data.items;
}

async function fetchPlayerData(tag) {
  const encodedTag = encodeURIComponent(tag);
  const res = await axios.get(
    `https://api.clashofclans.com/v1/players/${encodedTag}`,
    { headers: API_HEADERS }
  );
  return res.data;
}

// -----------------------
// MAIN TRACK FUNCTION
// -----------------------

async function trackContributions(bot, channelId) {
  console.log(`[DEBUG] ➜ Vérification contributions : ${new Date().toLocaleTimeString()}`);

  const contributionsData = loadData();
  const members = await fetchClanMembers();
  const membersFile = loadMembers();

  // 🔥 Suppression des membres qui ont quitté le clan
  const currentTags = new Set(members.map(m => m.tag));

  for (const tag of Object.keys(membersFile)) {
    if (!currentTags.has(tag)) {
      console.log(`[INFO] Suppression (a quitté le clan) : ${membersFile[tag].name}`);
      delete membersFile[tag];
    }
  }

  saveMembers(membersFile);

  // -----------------------
  // Parcours des membres du clan
  // -----------------------

  for (const member of members) {
    try {
      const player = await fetchPlayerData(member.tag);
      const total = player.clanCapitalContributions || 0;
      const prev = contributionsData[member.tag] || 0;

      // 🔥 DETECTION NOUVEAU JOUEUR (fiable)
      if (!membersFile[player.tag]) {
        membersFile[player.tag] = {
          name: player.name,
          joinDate: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
          isDiscord: false
        };
        saveMembers(membersFile);

        console.log(`[INFO] Nouveau membre détecté : ${player.name}`);

        const joinChannel = await bot.channels.fetch("1437513840974893058");
        joinChannel.send(`👋 **${player.name}** vient d'arriver dans le clan !`);
      }

      console.log(`[DEBUG] ${player.name} - Avant: ${prev}, Actuel: ${total}`);

      if (total > prev) {
        const diff = total - prev;

        // 🔔 Contributions
        const Contribtionchannel = await bot.channels.fetch("1437513840974893058");
        Contribtionchannel.send(`📢 **${player.name}** a contribué à la Capitale ! (+${diff} joyaux 💎)`);

        contributionsData[member.tag] = total;
      }

    } catch (err) {
      console.error(`❌ Erreur sur ${member.name} (${member.tag}) :`, err.message);
    }
  }


  saveData(contributionsData);
}

// -----------------------
// STARTER
// -----------------------

function startContributionTracking(bot, channelId) {
  console.log('✅ Contribution Tracker lancé (toutes les 30 secondes)');

  setInterval(() => {
    trackContributions(bot, channelId).catch(err =>
      console.error('❌ Erreur dans trackContributions :', err)
    );
  }, 30 * 1000);
}

module.exports = { startContributionTracking, fetchClanMembers };