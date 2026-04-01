const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../../data/log/ticketStatut.json");

function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) return [];
        const rawData = fs.readFileSync(dataFilePath, "utf-8");

        if (!rawData) return [];

        return JSON.parse(rawData);
    } catch (err) {
        console.error("Erreur en lisant le fichier de données :", err);
        return [];
    }
}

// Fonction pour écrire dans le fichier JSON
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), "utf-8");
    } catch (err) {
        console.error("Erreur en écrivant le fichier de données :", err);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticketstatut")
        .setDescription("Change le statut du ticket.")
        .addStringOption(option =>
            option
                .setName("statut")
                .setDescription("Choisis le nouveau statut du ticket.")
                .setRequired(true)
                .addChoices(
                    { name: "Pas encore pris ❌", value: "❌" },
                    { name: "En cours ⏳", value: "⏳" },
                    { name: "Terminé ✅", value: "✅" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    async run(interaction) {
        const member = interaction.member;
        const channel = interaction.channel;
        const STAFF_ROLE_ID = "1439674603030188053";
        const LOGS_CHANNEL_ID = "1439674736564109513";

        // Vérifie les perms
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission de changer le statut du ticket.",
                ephemeral: true
            });
        }

        const statutEmoji = interaction.options.getString("statut");

        // Vérifie que c’est bien un salon de ticket
        if (!channel.name.includes("・")) {
            return interaction.reply({
                content: "❌ Cette commande ne peut être utilisée que dans un ticket.",
                ephemeral: true
            });
        }

        try {
            // On garde juste la partie pseudo après le "・"
            const ticketName = channel.name.split("・").slice(1).join("・");
            await channel.setName(`${statutEmoji}・${ticketName}`);

            await interaction.reply({
                content: `✅ Le statut du ticket est maintenant : **${statutEmoji}**`,
                ephemeral: false
            });

            const logChannel = interaction.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if(logChannel) {
                const embed = new EmbedBuilder()
                .setTitle("🎟️ Statut du ticket modifié")
                .addFields(
                    { name: "👤 Modifié par", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "📂 Ticket", value: `${interaction.channel}`, inline: true },
                    { name: "🔄 Nouveau statut", value: `${statutEmoji}`, inline: true }
                )
                .setTimestamp()
                .setColor("#0099ff");

                await logChannel.send({ embeds: [embed] });
            }
            

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors du changement de statut.",
                ephemeral: true
            });
        }
        
        const currentData = readData();
        currentData.push({
            authorId: member.id,
            ticketId: channel.id,
            newStatus: statutEmoji,
            changedBy: member.user.tag,
            timestamp: new Date().toISOString()
        })
        writeData(currentData);
    }
};
