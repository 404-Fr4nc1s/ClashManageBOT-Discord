const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const coc = require("../../events/coc/cocClient");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profiladvanced")
        .setDescription("Affiche un profil Clash of Clans complet (version détaillée).")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("tag")
                .setDescription("Le tag du joueur (ex: #ABCD123)")
                .setRequired(true)
        ),
    async run(interaction) {
        const tag = interaction.options.getString("tag").toUpperCase().replace(/O/g, "0");
        
        try {
            const player = await coc.getPlayer(tag);
            
            // ✅ RÉCUPÉRATION SIMPLE DES EMOJIS
            const hdvEmojis = interaction.client.cocEmojis.hdv;
            const bhEmojis = interaction.client.cocEmojis.bh;
            const heroEmojis = interaction.client.cocEmojis.heroes;
            
            // --- FONCTIONS UTILES ---
            const percentFormat = value => (value >= 100 ? `✨ 100%` : `🟢 ${value}%`);
            const calcAverageProgress = items => {
                if (!items?.length) return 0;
                const total = items.reduce((sum, i) => sum + (i.level / i.maxLevel), 0);
                return Math.round((total / items.length) * 100);
            };
            const getHero = name => player.heroes.find(h => h.name === name);
            
            // --- HÉROS PRINCIPAUX ---
            const king = getHero("Barbarian King");
            const queen = getHero("Archer Queen");
            const warden = getHero("Grand Warden");
            const champ = getHero("Royal Champion");
            const minion = getHero("Minion Prince");
            
            // --- BUILDER BASE HÉROS ---
            const bm = getHero("Battle Machine");
            const bc = getHero("Battle Copter");
            
            // --- CLAN & LIGUE ---
            const clan = player.clan;
            const league = player.league?.name || "Non classé";
            
            // --- CALCULS DES PROGRESSIONS ---
            const heroProgress = calcAverageProgress(player.heroes.filter(h => h.village === "home"));
            const troopProgress = calcAverageProgress(player.troops.filter(t => t.village === "home"));
            const spellProgress = calcAverageProgress(player.spells.filter(s => s.village === "home"));
            const totalProgress = Math.round((heroProgress + troopProgress + spellProgress) / 3);
            
            // --- BUILDER BASE ---
            const builderHeroes = player.heroes.filter(h => h.village === "builderBase");
            const builderTroops = player.troops.filter(t => t.village === "builderBase");
            const builderHeroProgress = calcAverageProgress(builderHeroes);
            const builderTroopProgress = calcAverageProgress(builderTroops);
            const builderTotalProgress = Math.round((builderHeroProgress + builderTroopProgress) / 2);
            
            // --- EMBED ---
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: clan?.name || "Sans clan",
                    iconURL: clan?.badgeUrls?.small || null
                })
                .setTitle(`**${player.name}** - ${player.tag}`)
                .setColor("#FFCC00")
                .setThumbnail(clan?.badgeUrls?.large || null)
                .setDescription(
                    `**Hôtel de ville**
                    ${hdvEmojis[player.townHallLevel] || "🏠"} ${player.townHallLevel} - Défense ${player.townHallWeaponLevel || 0}
                    
                    👑 **Héros principaux**
                    ${heroEmojis.barbarianking} ${king?.level || 0}|${king?.maxLevel || 0} · ${heroEmojis.archerqueen} ${queen?.level || 0}|${queen?.maxLevel || 0} · ${heroEmojis.grandwarden} ${warden?.level || 0}|${warden?.maxLevel || 0} · ${heroEmojis.royalchampion} ${champ?.level || 0}|${champ?.maxLevel || 0} · ${heroEmojis.minionprince} ${minion?.level || 0}|${minion?.maxLevel || 0}
                    
                    ${percentFormat(heroProgress)} | Héros  
                    ${percentFormat(troopProgress)} | Troupes  
                    ${percentFormat(spellProgress)} | Sorts  
                    ${percentFormat(totalProgress)} | Total  
                    
                    **Maison des ouvriers**
                    ${bhEmojis[player.builderHallLevel] || "🏗️"} ${player.builderHallLevel}
                    ${heroEmojis.battlemachine} ${bm?.level || 0}|${bm?.maxLevel || 0} · ${heroEmojis.battlecopter} ${bc?.level || 0}|${bc?.maxLevel || 0}
                    
                    ${percentFormat(builderHeroProgress)} | Héros  
                    ${percentFormat(builderTroopProgress)} | Troupes  
                    ${percentFormat(builderTotalProgress)} | Total`
                )
                .addFields(
                    { name: "Niveau d'expérience", value: `${player.expLevel} ${interaction.client.cocEmojis.stats.xp}`, inline: true },
                    { name: "Étoiles de Guerre", value: `${player.warStars} ${interaction.client.cocEmojis.stats.stars}`, inline: true },
                    { name: "Clan", value: `${clan?.name || "Aucun"} - ${clan?.tag || "N/A"}`, inline: true },

                    { name: "Rôle", value: `${player.role ? player.role.charAt(0).toUpperCase() + player.role.slice(1) : "Aucun"}`, inline: true },
                    { name: "Ligue", value: `${league}`, inline: true },
                    { name: "Trophées", value: `${player.trophies} ${interaction.client.cocEmojis.stats.trophy}`, inline: true },

                    { name: "Trophées base ouvrière", value: `${player.builderBaseTrophies || 0} ${interaction.client.cocEmojis.stats.builderTrophy}`, inline: true },
                    { name: "Attaques gagnées", value: `${player.attackWins || 0}`, inline: true },
                    { name: "Défenses gagnées", value: `${player.defenseWins || 0}`, inline: true },

                    { name: "Troupes données", value: `${player.donations || 0}`, inline: true },
                    { name: "Troupes reçues", value: `${player.donationsReceived || 0}`, inline: true },
                    { name: "Capitale du clan", value: `${player.clanCapitalContributions?.toLocaleString("fr-FR") || 0} points`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: "❌ Impossible de récupérer ce joueur. Vérifie que le tag est correct (ex: `#XXXXXXX`).",
                ephemeral: true
            });
        }
    }
};