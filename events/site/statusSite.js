const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const SITE_URL = "https://clashmanage.fr";
const CHANNEL_ID = "1457125632608702696";  // ID du channel
let statusMessageId = null;  // Pour garder l'ID du message pour mise à jour

// Fonction pour vérifier si le site est en ligne
async function checkSite(channel) {
  let embed;

  try {
    const start = Date.now();
    await axios.get(SITE_URL, { timeout: 5000 });  // Vérifie avec un timeout de 5 secondes
    const ping = Date.now() - start;

    embed = new EmbedBuilder()
      .setTitle("📡 Statut du site")
      .setColor("Green")
      .addFields(
        { name: "Site", value: SITE_URL, inline: false },
        { name: "Statut", value: "🟢 En ligne", inline: true },
        { name: "Temps de réponse", value: `${ping} ms`, inline: true }
      )
      .setTimestamp();

  } catch (error) {
    embed = new EmbedBuilder()
      .setTitle("📡 Statut du site")
      .setColor("Red")
      .addFields(
        { name: "Site", value: SITE_URL, inline: false },
        { name: "Statut", value: "🔴 Hors ligne", inline: true }
      )
      .setTimestamp();
  }

  // Si le message existe déjà, on le met à jour, sinon on l'envoie
  if (statusMessageId) {
    const message = await channel.messages.fetch(statusMessageId);
    message.edit({ embeds: [embed] });
  } else {
    const message = await channel.send({ embeds: [embed] });
    statusMessageId = message.id;
  }
}

// Fonction qui sera appelée sur l'event "ready"
module.exports = {
  name: 'ready',
  once: true,
  run: async (client) => {
    // Cherche le channel avec l'ID
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    // Envoie un premier embed ou met à jour si déjà envoyé
    await checkSite(channel);

    // Vérification toutes les 60 secondes
    setInterval(() => checkSite(channel), 60000);
  }
};
