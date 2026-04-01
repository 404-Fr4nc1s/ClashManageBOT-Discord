async function loadChannelConfig() {
  try {
    const response = await fetch('/data/config/logsConfig.json');
    if (!response.ok) throw new Error("Impossible de charger logsConfig.json");

    const data = await response.json();

    // On remplit chaque input si la clé existe dans le JSON
    for (const key in data) {
      const input = document.getElementById(key);
      if (input) {
        input.value = data[key];
      }
    }

    console.log("Channel IDs chargés avec succès !");
    
  } catch (err) {
    console.error("Erreur lors du chargement :", err);
  }
}

// charger automatiquement au chargement de la page
window.addEventListener("DOMContentLoaded", loadChannelConfig);

let originalValues = {};

async function loadChannelConfig() {
  try {
    const response = await fetch('/data/config/logsConfig.json');
    if (!response.ok) throw new Error("Impossible de charger logsConfig.json");

    const data = await response.json();

    originalValues = { ...data }; // On sauvegarde les valeurs d'origine

    // On remplit les inputs
    for (const key in data) {
      const input = document.getElementById(key);
      if (input) input.value = data[key];
    }

    console.log("Channel IDs chargés !");
  } catch (err) {
    console.error("Erreur lors du chargement :", err);
  }
}

window.addEventListener("DOMContentLoaded", loadChannelConfig);

document.addEventListener("click", async (e) => {
  // BOUTON ANNULER
  if (e.target.closest(".btn-cancel")) {
    const card = e.target.closest(".channelCard");
    const input = card.querySelector("input");
    const id = input.id;

    // remettre valeur d'origine
    input.value = originalValues[id] || "";
    console.log("Valeur restaurée pour", id);
  }

  // BOUTON VALIDER
  if (e.target.closest(".btn-validate")) {
    const card = e.target.closest(".channelCard");
    const input = card.querySelector("input");
    const id = input.id;
    const newValue = input.value;

    try {
      const response = await fetch("/updateChannelID", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: id, value: newValue })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l'enregistrement: ${errorText}`);
      }

      // on met à jour la valeur d'origine
      originalValues[id] = newValue;

      console.log("Nouvelle valeur sauvegardée :", id, newValue);
      
      // Feedback visuel (optionnel)
      const btn = e.target.closest(".btn-validate");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Sauvegardé !';
      btn.style.backgroundColor = '#28a745';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
      }, 2000);

    } catch (err) {
      console.error("Erreur :", err);
      alert("Erreur lors de la sauvegarde : " + err.message);
    }
  }
});