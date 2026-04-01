const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { clanTag, clashApiToken } = require('../../config');

const SNAPSHOT_PATH = path.join(__dirname, '../../data/capitalSnapshot.json');

const API_HEADERS = { Authorization: `Bearer ${clashApiToken}` };

// ------------------------
// LOAD / SAVE SNAPSHOT
// ------------------------

function loadSnapshot() {
  // Si le fichier n'existe pas → créer un snapshot vide
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    const emptySnapshot = { districts: {}, lastUpdated: null };
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(emptySnapshot, null, 2));
    return emptySnapshot;
  }

  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    if (!raw.trim()) throw new Error("empty file"); // fichier vide

    return JSON.parse(raw);

  } catch (err) {
    console.warn(`[WARN] Snapshot corrompu → réinitialisation.`);

    const emptySnapshot = { districts: {}, lastUpdated: null };
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(emptySnapshot, null, 2));
    return emptySnapshot;
  }
}


function saveSnapshot(snapshot) {
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
}

// ------------------------
// FETCH CLAN CAPITAL DATA
// ------------------------

async function fetchClanCapital() {
  const encodedTag = encodeURIComponent(clanTag);
  const res = await axios.get(
    `https://api.clashofclans.com/v1/clans/${encodedTag}`,
    { headers: API_HEADERS }
  );
  return res.data.clanCapital?.districts || [];
}

// ------------------------
// DISTRICT SNAPSHOT FORMATTER
// ------------------------

function formatDistricts(districts) {
  const result = {};
  for (const d of districts) {
    result[d.name] = {
      level: d.level,
      totalUpgradeCost: d.totalUpgradeCost ?? 0,
      currentUpgradeCost: d.currentUpgradeCost ?? 0
    };
  }
  return result;
}

// ------------------------
// MAIN TRACK FUNCTION
// ------------------------

async function trackCapitalDistricts(bot, channelId) {
  const oldSnapshot = loadSnapshot();
  const newDistricts = await fetchClanCapital();
  const newSnapshot = {
    districts: formatDistricts(newDistricts),
    lastUpdated: new Date().toISOString()
  };

  const channel = await bot.channels.fetch(channelId);

  // Compare district by district
  for (const name in newSnapshot.districts) {
    const oldD = oldSnapshot.districts[name];
    const newD = newSnapshot.districts[name];

    // First time tracking → skip
    if (!oldD) continue;

    // Detect contribution (cost decreased)
    if (newD.currentUpgradeCost < oldD.currentUpgradeCost) {
      const diff = oldD.currentUpgradeCost - newD.currentUpgradeCost;

      channel.send(
        `🏛️ **Contribution détectée dans ${name}** : -${diff} gold 🪙`
      );
    }

    // Detect upgrade (level up)
    if (newD.level > oldD.level) {
      channel.send(
        `🎉 **${name} a été amélioré !** → Niveau ${newD.level} 🔺`
      );
    }
  }

  saveSnapshot(newSnapshot);
}

// ------------------------
// STARTER
// ------------------------

function startCapitalTracking(bot, channelId) {
  console.log('🏛️ Capital Tracker lancé (toutes les 30 secondes)');

  setInterval(() => {
    trackCapitalDistricts(bot, channelId)
      .catch(err => console.error("[ERROR] Capital tracking:", err));
  }, 30 * 1000);
}

module.exports = { startCapitalTracking };
