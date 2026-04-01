const { readdirSync, readFileSync } = require("fs");
const path = require("path");

module.exports = async function loadEmojis(client) {
    const emojiDataPath = path.join(__dirname, "../data/emojis.json");
    
    try {
        const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"));
        
        client.cocEmojis = {};
        
        let loadedCount = 0;
        
        // Charge les emojis HDV
        if (emojiData.hdv) {
            client.cocEmojis.hdv = {};
            for (let i = 1; i <= 17; i++) {
                const emojiId = emojiData.hdv[i];
                if (emojiId) {
                    client.cocEmojis.hdv[i] = `<:hdv${i}:${emojiId}>`;
                    loadedCount++;
                }
            }
        }
        
        // Charge les emojis Builder Hall
        if (emojiData.bh) {
            client.cocEmojis.bh = {};
            for (let i = 1; i <= 10; i++) {
                const emojiId = emojiData.bh[i];
                if (emojiId) {
                    client.cocEmojis.bh[i] = `<:bh${i}:${emojiId}>`;
                    loadedCount++;
                }
            }
        }
        
        // Charge les emojis héros
        if (emojiData.heroes) {
            client.cocEmojis.heroes = {};
            for (const [key, emojiId] of Object.entries(emojiData.heroes)) {
                client.cocEmojis.heroes[key] = `<:${key}:${emojiId}>`;
                loadedCount++;
            }
        }
        
        // ✅ Charge les emojis de stats
        if (emojiData.stats) {
            client.cocEmojis.stats = {};
            for (const [key, emojiId] of Object.entries(emojiData.stats)) {
                // Récupère le nom de l'emoji depuis le Developer Portal
                const emojiNames = {
                    "xp": "XP",
                    "stars": "3Stars",
                    "trophy": "RegularTrophy",
                    "builderTrophy": "BuilderBaseTrophy",
                    "arrowUp": "arrow_up",
                    "arrowDown": "arrow_down"
                };
                client.cocEmojis.stats[key] = `<:${emojiNames[key]}:${emojiId}>`;
                loadedCount++;
            }
        }
        
        console.log(`[Emojis] => ${loadedCount} emojis CoC chargés`);
        
    } catch (error) {
        console.error("[Emojis] Erreur lors du chargement des emojis:", error.message);
        console.log("[Emojis] Utilisation des emojis par défaut...");
        
        client.cocEmojis = {
            hdv: Object.fromEntries(Array.from({length: 17}, (_, i) => [i + 1, "🏠"])),
            bh: Object.fromEntries(Array.from({length: 10}, (_, i) => [i + 1, "🏗️"])),
            heroes: {
                "barbarianking": "👑",
                "archerqueen": "👸",
                "grandwarden": "🧙",
                "royalchampion": "⚔️",
                "minionprince": "👻",
                "battlemachine": "🤖",
                "battlecopter": "🚁"
            },
            stats: {
                "xp": "⭐",
                "stars": "⭐",
                "trophy": "🏆",
                "builderTrophy": "🏗️",
                "arrowUp": "⬆️",
                "arrowDown": "⬇️"
            }
        };
    }
};