const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { data } = require("./statuticket");

const dataFilePath = path.join(__dirname, "../../data/log/ticketRename.json");

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
        .setName("ticketrename")
        .setDescription("Renomme le ticket.")
        .addUserOption(option =>
            option.setName("membre").setDescription("Le membre à qui renommer le ticket.").setRequired(true)
        ),
    
    async run(interaction) {
        try {
            const member = interaction.member;
            const channel = interaction.channel;
            const STAFF_ROLE_ID = "1439674603030188053"; 
            const LOGS_CHANNEL_ID = "1439674740850823369";

            if(!member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Tu n’as pas la permission de renommer le ticket.",
                    ephemeral: true
                });
            }

            
            const statutEmoji = channel.name.split("・")[0];
            const ticketName = interaction.options.getUser("membre").username;
            await channel.setName(`${statutEmoji}・${ticketName}`);

            await interaction.reply({
                content: `✅ Le statut du ticket est maintenant : **${ticketName}**`,
                ephemeral: false
            });

            const logChannel = interaction.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if(logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#2ecc71")
                    .setTitle("✏️ Ticket renommé")
                    .addFields(
                        { name: "Renommé par", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Nouveau nom", value: `${channel.name}`, inline: true }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }

        } catch (err) {
            console.error(err);
            return interaction.reply("❌ Une erreur est survenue lors du renommage du ticket.");
        }

        const currentData = readData();
        currentData.push({
            channelId: interaction.channel.id,
            renamedBy: interaction.user.id,
            newName: interaction.channel.name,
            timestamp: new Date().toISOString()
        });
        writeData(currentData);
    }
};