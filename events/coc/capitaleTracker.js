const axios = require("axios");
const config = require("../../config");

let lastData = {};

function getCapitalRaidUrl(clanTag) {
  const encodedTag = encodeURIComponent(clanTag);
  return `https://api.clashofclans.com/v1/clans/${encodedTag}/capitalraidseasons`;
}

async function fetchCapitalRaid(clanTag) {
  const response = await axios.get(getCapitalRaidUrl(clanTag), {
    headers: {
      Authorization: `Bearer ${config.clashApiToken}`
    }
  });

  return response.data?.items?.[0]?.members || [];
}

function detectChanges(newData, oldData) {
  const changes = [];

  for (const member of newData) {
    const oldMember = oldData[member.tag];
    if (!oldMember) continue;

    const attacksDiff = member.attackCount - oldMember.attackCount;
    const lootDiff = member.capitalResourcesLooted - oldMember.capitalResourcesLooted;

    if (attacksDiff > 0 || lootDiff > 0) {
      changes.push({
        name: member.name,
        attacksDiff,
        lootDiff
      });
    }
  }

  return changes;
}

async function updateAndNotify(bot, clanTag, channelId) {
  try {
    const newDataList = await fetchCapitalRaid(clanTag);
    const newDataMap = {};

    for (const member of newDataList) {
      newDataMap[member.tag] = {
        name: member.name,
        attackCount: member.attackCount,
        capitalResourcesLooted: member.capitalResourcesLooted
      };
    }

    if (Object.keys(lastData).length > 0) {
      const changes = detectChanges(newDataList, lastData);

      if (changes.length > 0) {
        const channel = await bot.channels.fetch(channelId);
        for (const c of changes) {
          let msg = `🏰 **${c.name}** a `;
          if (c.attacksDiff > 0) msg += `attaqué **${c.attacksDiff}** fois `;
          if (c.lootDiff > 0) msg += `et contribué **${c.lootDiff}** ressources à la capitale.`;

          await channel.send(msg);
        }
      }
    }

    lastData = newDataMap;
  } catch (err) {
    console.error("Erreur dans le capitaleTracker :", err.message);
  }
}

function startCapitalTracking(bot, clanTag, channelId) {
  updateAndNotify(bot, clanTag, channelId); // Exécution immédiate
  setInterval(() => updateAndNotify(bot, clanTag, channelId), 30 * 1000); // Toutes les 30s
}

module.exports = { startCapitalTracking };
