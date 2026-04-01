const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../../data/log/ticketClosed.json");

// Fonction pour lire le fichier JSON
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
        .setName("closeticket")
        .setDescription("Ferme le ticket actuel et l’archive.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),
    category: "Modération",

    async run(interaction) {
        const guild = interaction.guild;
        const channel = interaction.channel;
        const member = interaction.member;

        const STAFF_ROLE_ID = "1439674603030188053"; 
        const ARCHIVE_CATEGORY_ID = "1439674649947406336"; 

        // Vérifie si l'utilisateur a le rôle staff
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission de fermer un ticket.",
                ephemeral: true
            });
        }

        // Vérifie que c’est bien un salon de ticket
        if (!channel.name.includes("⏳・") && !channel.name.includes("🔄・") && !channel.name.includes("✅・") && !channel.name.includes("❌・")) {
            return interaction.reply({
                content: "❌ Cette commande ne peut être utilisée que dans un ticket.",
                ephemeral: true
            });
        }

        try {
            // Retirer les permissions du créateur
            const overwrites = channel.permissionOverwrites.cache;
            const ticketOwner = overwrites.find(ow => ow.allow.has(PermissionFlagsBits.ViewChannel) && ow.type === 1);

            if (ticketOwner) {
                await channel.permissionOverwrites.edit(ticketOwner.id, { ViewChannel: false });
            }

            // Déplacer le salon dans la catégorie archive
            await channel.setParent(ARCHIVE_CATEGORY_ID);
            await channel.setName(channel.name.replace(/^.*・/, "✅・")); // remplacer le statut par ✅

            await interaction.reply({
                content: `📁 Ticket archivé avec succès par <@${member.id}>.`,
                ephemeral: false
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de la fermeture du ticket.",
                ephemeral: true
            });
        }

        const currentData = readData();
        currentData.push({
            ticketId: channel.id,
            closedBy: member.user.tag,
            timestamp: new Date().toISOString()
        })
        writeData(currentData);
    }
};
