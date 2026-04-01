const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loadbackup")
        .setDescription("Charge une sauvegarde du serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("id")
                .setDescription("L'ID de la sauvegarde à charger")
                .setRequired(true)
        )
        .setDMPermission(false),
    category: "Administration",

    async run(interaction) {
        const id = interaction.options.getString("id");
        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, `../../backups/${guildId}/${id}.json`);

        if (!fs.existsSync(filePath))
            return interaction.reply({ content: "❌ Aucune sauvegarde trouvée avec cet ID.", ephemeral: true });

        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

        const guild = interaction.guild;

        await interaction.reply({ content: `🔁 Restauration de la sauvegarde **${id}**...`, ephemeral: true });

        // ✅ Envoyer un message DM de suivi
        let dmMessage = null;
        try {
            const dm = await interaction.user.send(`🧱 Début de la restauration de **${data.name}** sur **${guild.name}**...`);
            dmMessage = dm; // c’est le message qu’on mettra à jour
        } catch {
            console.log("Impossible d’envoyer un DM à l’utilisateur.");
        }

        const updateStatus = async (status, done, total) => {
            const percent = total ? Math.floor((done / total) * 100) : 0;
            const progressBar = "▓".repeat(percent / 10) + "░".repeat(10 - percent / 10);
            const msg = `🧱 Restauration de **${data.name}** sur **${guild.name}**\n\n` +
                `📋 Étape : **${status}**\n` +
                `📊 Progression : **${percent}%** [${progressBar}] (${done}/${total})`;

            if (dmMessage) await dmMessage.edit(msg).catch(() => {});
        };

        try {
            let done = 0;

            // Étape 1 : suppression des salons
            const channels = Array.from(guild.channels.cache.values());
            const totalChannels = channels.length;
            await updateStatus("Suppression des salons...", done, totalChannels);
            for (const c of channels) {
                await c.delete().catch(() => {});
                done++;
                if (done % 5 === 0) await updateStatus("Suppression des salons...", done, totalChannels);
            }

            // Étape 2 : suppression des rôles
            const roles = Array.from(guild.roles.cache.filter(r => !r.managed && r.id !== guild.id).values());
            const totalRoles = roles.length;
            done = 0;
            await updateStatus("Suppression des rôles...", done, totalRoles);
            for (const r of roles) {
                await r.delete().catch(() => {});
                done++;
                if (done % 5 === 0) await updateStatus("Suppression des rôles...", done, totalRoles);
            }

            // Étape 3 : suppression des émojis
            const emojis = Array.from(guild.emojis.cache.values());
            const totalEmojis = emojis.length;
            done = 0;
            await updateStatus("Suppression des émojis...", done, totalEmojis);
            for (const e of emojis) {
                await e.delete().catch(() => {});
                done++;
                if (done % 2 === 0) await updateStatus("Suppression des émojis...", done, totalEmojis);
            }

            // Étape 4 : création des rôles
            const totalNewRoles = data.roles.length;
            done = 0;
            await updateStatus("Création des rôles...", done, totalNewRoles);
            const roleMap = {};
            for (const roleData of data.roles.sort((a, b) => a.position - b.position)) {
                const role = await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable,
                    position: roleData.position
                }).catch(() => {});
                if (role) roleMap[roleData.name] = role;
                done++;
                if (done % 3 === 0) await updateStatus("Création des rôles...", done, totalNewRoles);
            }

            // Étape 5 : création des catégories
            const categories = data.channels.filter(c => c.type === ChannelType.GuildCategory);
            const totalCats = categories.length;
            done = 0;
            await updateStatus("Création des catégories...", done, totalCats);
            const categoryMap = {};
            for (const catData of categories.sort((a, b) => a.position - b.position)) {
                const category = await guild.channels.create({
                    name: catData.name,
                    type: ChannelType.GuildCategory,
                    position: catData.position
                }).catch(() => {});
                if (category) categoryMap[catData.name] = category;
                done++;
                if (done % 3 === 0) await updateStatus("Création des catégories...", done, totalCats);
            }

            // Étape 6 : création des salons
            const newChannels = data.channels.filter(c => c.type !== ChannelType.GuildCategory);
            const totalNewCh = newChannels.length;
            done = 0;
            await updateStatus("Création des salons...", done, totalNewCh);
            for (const channelData of newChannels.sort((a, b) => a.position - b.position)) {
                const parent = channelData.parent ? categoryMap[channelData.parent] : null;
                await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    topic: channelData.topic,
                    nsfw: channelData.nsfw,
                    rateLimitPerUser: channelData.rateLimitPerUser,
                    parent: parent || undefined,
                    position: channelData.position
                }).catch(() => {});
                done++;
                if (done % 3 === 0) await updateStatus("Création des salons...", done, totalNewCh);
            }

            // Étape 7 : recréation des émojis
            const totalNewEmojis = data.emojis.length;
            done = 0;
            await updateStatus("Création des émojis...", done, totalNewEmojis);
            for (const emojiData of data.emojis) {
                await guild.emojis.create({ attachment: emojiData.url, name: emojiData.name }).catch(() => {});
                done++;
                if (done % 2 === 0) await updateStatus("Création des émojis...", done, totalNewEmojis);
            }

            // --- Étape 8 : réassignation des rôles aux membres ---
            const totalMembers = data.members.length;
            done = 0;
            await updateStatus("Réattribution des rôles aux membres...", done, totalMembers);

            for (const memberData of data.members) {
                const member = await guild.members.fetch(memberData.id).catch(() => null);
                if (!member) {
                    done++;
                    if (done % 3 === 0) await updateStatus("Réattribution des rôles aux membres...", done, totalMembers);
                    continue;
                }

                // Récupérer les rôles existants dans le serveur et mapper par nom
                const rolesToAdd = memberData.roles
                    .map(roleName => roleMap[roleName])
                    .filter(r => r && r.position < guild.members.me.roles.highest.position); // le bot doit pouvoir gérer

                if (rolesToAdd.length > 0) {
                    // On applique les rôles dans l’ordre croissant de position pour éviter les conflits Discord
                    const sortedRoles = rolesToAdd.sort((a, b) => a.position - b.position);
                    await member.roles.set(sortedRoles).catch(err => console.log("Erreur roles.set:", err));
                }

                done++;
                if (done % 3 === 0) await updateStatus("Réattribution des rôles aux membres...", done, totalMembers);
            }


            // ✅ Fin
            await updateStatus("Restauration terminée ✅", 1, 1);
            try {
                await interaction.editReply({ content: `✅ Sauvegarde **${id}** restaurée avec succès !` });
            } catch {
                // Le message d’interaction n’existe plus
            }

        } catch (err) {
            console.error(err);
            if (dmMessage) {
                await dmMessage.edit("❌ Une erreur est survenue pendant la restauration !");
            }
        }
    }
};
