const { Events, EmbedBuilder } = require("discord.js");
const { getLogChannel } = require("../../utils/logsConfig");
const fs = require("fs");
const path = require("path");

// Chemin du fichier de log JSON
const dataFilePath = path.join(__dirname, "../../data/log/roleUpdate.json");

// Fonction pour lire les données JSON
function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) return [];
        const rawData = fs.readFileSync(dataFilePath, "utf-8").trim();
        if (!rawData) return [];
        return JSON.parse(rawData);
    } catch (err) {
        console.error("Erreur en lisant le fichier JSON :", err);
        return [];
    }
}

// Fonction pour écrire dans le fichier JSON
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), "utf-8");
    } catch (err) {
        console.error("Erreur en écrivant dans le fichier JSON :", err);
    }
}

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,

    async run(client, oldMember, newMember) {
        

        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size === 0 && removedRoles.size === 0) return;

        // Petit délai pour que les logs d’audit soient corrects
        await new Promise(res => setTimeout(res, 1500));

        // Récupérer l'auteur de la modification
        let executor = "Inconnu";
        try {
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 5,
                type: 25, // MEMBER_ROLE_UPDATE
            });

            const roleLog = fetchedLogs.entries.find(entry =>
                entry.target.id === newMember.id &&
                Date.now() - entry.createdTimestamp < 5000
            );

            if (roleLog && roleLog.executor) executor = roleLog.executor.tag;
        } catch (err) {
            console.error("Erreur audit log:", err);
        }

        // --- Embed pour Discord ---
        const embed = new EmbedBuilder()
            .setTitle("🔄 Mise à jour des rôles")
            .setDescription(`Les rôles de <@${newMember.id}> ont été modifiés`)
            .addFields(
                { name: "Modifié par:", value: executor, inline: true },
                { name: "Date:", value: new Date().toLocaleString(), inline: true }
            )
            .setThumbnail(newMember.user.displayAvatarURL())
            .setFooter({ text: `Utilisateur ID: ${newMember.id}` })
            .setTimestamp();

        if (addedRoles.size > 0) {
            embed.addFields({
                name: "✅ Rôles ajoutés",
                value: addedRoles.map(r => r.name).join(", "),
                inline: false
            });
            embed.setColor("#18ff00");
        }

        if (removedRoles.size > 0) {
            embed.addFields({
                name: "❌ Rôles retirés",
                value: removedRoles.map(r => r.name).join(", "),
                inline: false
            });
            embed.setColor("#ff0000");
        }

        const logChannelId = getLogChannel("roleUpdate");
        if (!logChannelId) return;

        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [embed] });


        // --- Stockage dans le JSON ---
        const currentData = readData();
        currentData.push({
            memberId: newMember.id,
            memberTag: newMember.user.tag,
            executor: executor,
            addedRoles: addedRoles.map(r => ({ id: r.id, name: r.name })),
            removedRoles: removedRoles.map(r => ({ id: r.id, name: r.name })),
            timestamp: new Date().toISOString()
        });
        writeData(currentData);
    }
};
