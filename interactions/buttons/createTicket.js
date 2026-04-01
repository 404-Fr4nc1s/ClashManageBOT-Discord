const { PermissionFlagsBits, ComponentType, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data/log");
const dataFilePath = path.join(__dirname, "../../data/log/ticketCreated.json");

// ✅ Fonction de lecture du fichier
function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) return [];

        const rawData = fs.readFileSync(dataFilePath, "utf-8").trim();
        if (!rawData) return [];

        const parsed = JSON.parse(rawData);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("❌ Erreur en lisant le fichier de données :", err);
        return [];
    }
}

// ✅ Fonction d’écriture sécurisée dans le fichier JSON
function writeData(data) {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const tempPath = dataFilePath + ".tmp";

        fs.writeFileSync(tempPath, JSON.stringify(data, null, 4), "utf-8");
        fs.renameSync(tempPath, dataFilePath); // remplace de manière atomique

    } catch (err) {
        console.error("❌ Erreur en écrivant le fichier de données :", err);
    }
}

module.exports = {
    name: "createTicket",
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.UseExternalEmojis
    ],

    async run(interaction) {
        const guild = interaction.guild;
        const member = interaction.member;
        const parentCategoryID = "1439674636307795990";

        const botMember = guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: "❌ Je n'ai pas la permission de créer des salons.",
                ephemeral: true
            });
        }

        // 🔍 Vérifie si un ticket existe déjà
        const existingTicket = guild.channels.cache.find(
            ch =>
                ch.name === `❌・${member.user.username.toLowerCase()}` &&
                ch.parentId === parentCategoryID
        );

        if (existingTicket) {
            return interaction.reply({
                content: `⚠️ Tu as déjà un ticket ouvert : ${existingTicket}`,
                ephemeral: true
            });
        }

        let channel;
        try {
            // 🎫 Création du ticket
            channel = await guild.channels.create({
                name: `❌・${member.user.username}`,
                type: ChannelType.GuildText,
                parent: parentCategoryID,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: "1439674603030188053", // Rôle staff
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: botMember.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    }
                ]
            });

            await channel.send({
                content: `🎟️ **Ticket ouvert par <@${member.id}>**\nMerci de patienter, un membre du staff va bientôt te répondre.\nEn attendant, écris-nous ton problème.`
            });

            await interaction.reply({
                content: `✅ Ton ticket a été créé avec succès : ${channel}`,
                ephemeral: true
            });
        } catch (error) {
            console.error("❌ Erreur création du ticket :", error);
            return interaction.reply({
                content: "❌ Une erreur est survenue lors de la création du ticket.",
                ephemeral: true
            });
        }

        // 💾 Sauvegarde sécurisée du ticket
        try {
            const currentData = readData();
            currentData.push({
                authorId: member.id,
                ticketId: channel.id,
                createdBy: member.user.tag,
                timestamp: new Date().toISOString()
            });
            writeData(currentData);
        } catch (err) {
            console.error("❌ Erreur lors de la sauvegarde du ticket :", err);
        }
    }
};
