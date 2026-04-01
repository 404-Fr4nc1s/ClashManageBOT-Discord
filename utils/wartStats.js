const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/war-attacks.json");

function loadAttacks() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return [];
  }
}

function computeWarStats() {
  const attacks = loadAttacks();

  const stats = {};

  for (const atk of attacks) {
    const tag = atk.attackerTag;
    const name = atk.attackerName;
    const destruction = atk.destruction ?? 0;

    // Init
    if (!stats[tag]) {
      stats[tag] = {
        name,
        attacks: 0,
        starsTotal: 0,
        destructionTotal: 0,
        best: { stars: 0, destruction: 0 },
        worst: { stars: 3, destruction: 100 },
      };
    }

    const p = stats[tag];

    // Cumul
    p.attacks++;
    p.starsTotal += atk.stars;
    p.destructionTotal += destruction;

    // Meilleure attaque
    if (
      atk.stars > p.best.stars ||
      (atk.stars === p.best.stars && destruction > p.best.destruction)
    ) {
      p.best = { stars: atk.stars, destruction };
    }

    // Pire attaque
    if (
      atk.stars < p.worst.stars ||
      (atk.stars === p.worst.stars && destruction < p.worst.destruction)
    ) {
      p.worst = { stars: atk.stars, destruction };
    }
  }

  // Calcul des ratios
  for (const player of Object.values(stats)) {
    player.starsAvg = player.starsTotal / player.attacks;
    player.destructionAvg = player.destructionTotal / player.attacks;

    // Score global (étoiles + destruction)
    player.score = Math.round(player.starsTotal * 30 + player.destructionAvg);
  }

  return stats;
}

function getRanking() {
  const stats = computeWarStats();

  return Object.values(stats).sort((a, b) => {
    return b.score - a.score; // Tri par score global
  });
}

module.exports = { computeWarStats, getRanking };
