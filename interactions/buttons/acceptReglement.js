const { ComponentType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data/log');
const dataFile = path.join(dataDir, 'reglementAccepted.json');

function readData() {
    try {
        if (!fs.existsSync(dataFile)) return [];
        const raw = fs.readFileSync(dataFile, 'utf-8').trim();
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (err) {
        console.error('❌ Erreur lecture fichier :', err);
        return [];
    }
}

function writeData(data) {
    try {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 4), 'utf-8');
    } catch (err) {
        console.error('❌ Erreur écriture fichier :', err);
    }
}

module.exports = {
    name: 'acceptReglement',
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ],

    async run(interaction) {
        const member = interaction.member;
        const roleId = '1439674613465616395'; // rôle à donner quand le règlement est accepté

        try {
            if (member.roles.cache.has(roleId)) {
                return interaction.reply({ 
                    content: '⚠️ Tu as déjà accepté le règlement.', 
                    ephemeral: true 
                });
            }

            await member.roles.add(roleId);
            await interaction.reply({ 
                content: '✅ Tu as accepté le règlement et obtenu ton rôle ! Bienvenue dans le clan 🎉', 
                ephemeral: true 
            });

            // 💾 Sauvegarde de la validation
            const data = readData();
            data.push({
                userId: member.id,
                username: member.user.tag,
                timestamp: new Date().toISOString()
            });
            writeData(data);

        } catch (err) {
            console.error('❌ Erreur ajout rôle :', err);
            return interaction.reply({ 
                content: "❌ Impossible de te donner le rôle, vérifie mes permissions.", 
                ephemeral: true 
            });
        }
    }
};
