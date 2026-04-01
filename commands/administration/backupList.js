const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ComponentType } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("backuplist")
        .setDescription("Affiche la liste des sauvegardes du serveur actuel")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: "Administration",

    async run(interaction) {
        const guildId = interaction.guild.id;
        const guildDir = path.join(__dirname, `../../backups/${guildId}`);

        if (!fs.existsSync(guildDir)) {
            return interaction.reply({ content: "📦 Aucune sauvegarde trouvée pour ce serveur." });
        }

        const files = fs.readdirSync(guildDir).filter(f => f.endsWith(".json"));
        if (files.length === 0) {
            return interaction.reply({ content: "📦 Aucune sauvegarde disponible pour ce serveur." });
        }

        const backups = files.map(file => {
            const filePath = path.join(guildDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            return {
                id: file.replace(".json", ""),
                name: data.name || "Sauvegarde sans nom",
                author: data.authorTag || "Inconnu",
                date: new Date(data.date || fs.statSync(filePath).ctime)
            };
        });

        const embed = new EmbedBuilder()
            .setTitle(`📦 Sauvegardes du serveur : ${interaction.guild.name}`)
            .setColor("#2f3136")
            .setTimestamp()
            .setFooter({ text: `Total : ${backups.length} sauvegarde${backups.length > 1 ? "s" : ""}` });

        for (const backup of backups) {
            embed.addFields({
                name: `🧱 ${backup.name}`,
                value: `👤 **Créée par :** ${backup.author}\n🆔 **ID :** \`${backup.id}\`\n📅 **Date :** <t:${Math.floor(backup.date.getTime() / 1000)}:f>`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed]});

    }
};
