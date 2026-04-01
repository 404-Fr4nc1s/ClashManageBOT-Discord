function formatLog(entry, type) {
  const date = new Date(entry.timestamp).toLocaleString("fr-FR");

  switch(type) {
    case 'messageDelete':
      return `<strong>${entry.authorTag}</strong> :<br>
              <em>supprimé par ${entry.deletedBy}</em><br>
              <em>Contenu:</em> ${entry.content}<br>
              ${date}`;
    case 'messageUpdate':
      return `<strong>${entry.authorTag}</strong> :<br>
              <em>Ancien message →</em> ${entry.oldContent}<br>
              <em>Nouveau message →</em> ${entry.newContent}<br>
              ${date}`;
    case 'roleUpdate':
      const added = (entry.addedRoles || []).map(r => r.name).join(", ");
      const removed = (entry.removedRoles || []).map(r => r.name).join(", ");
      let changes = [];
      if (added) changes.push(`Ajouté → ${added}`);
      if (removed) changes.push(`Retiré → ${removed}`);
      return `<strong>${entry.memberTag}</strong> :<br>
              <em>Modifié par</em> ${entry.executor}<br>
              ${changes.join(" | ")}<br>
              ${date}`;
    case 'antilinkData':
      return `<strong>${entry.authorTag}</strong> :<br>
              lien interdit : ${entry.content}<br>
              ${date}`;
    case 'ticketStatut':
      return `<strong>${entry.ticketId}</strong> :<br>
              <em>Nouveau status →</em> ${entry.newStatus}<br>
              <em>Changer par →</em> ${entry.changedBy}<br>
              ${date}`;
    case 'ticketClosed':
      return `<strong>${entry.ticketId}</strong> :<br>
              <em>Fermé par →</em> ${entry.closedBy}<br>
              ${date}`;
    case 'ticketCreated':
      return `<strong>${entry.ticketId}</strong> :<br>
              <em>Créé par →</em> ${entry.createdBy}<br>
              ${date}`;
    default:
      return `[${date}] ${JSON.stringify(entry)}`;
  }
}

const logSelectors = document.querySelectorAll(".logSelector");
const logsOutput = document.getElementById("logsOutput");
const logTargetInput = document.getElementById("logTargetInput");
let currentLogType = null;

// Fonction pour afficher les logs
async function displayLogs(logType) {
  currentLogType = logType;
  document.getElementById("currentLogTitle").textContent = logType;

  logsOutput.innerHTML = "<p class='placeholder'>Chargement...</p>";

  try {
    const response = await fetch(`/data/log/${logType}.json`);
    if (!response.ok) throw new Error("Fichier non trouvé");
    const data = await response.json();

    const filterId = logTargetInput.value.trim();
    const filtered = filterId ? data.filter(e => JSON.stringify(e).includes(filterId)) : data;

    if (!filtered.length) {
      logsOutput.innerHTML = "<p class='placeholder'>Aucun log trouvé pour ce filtre.</p>";
      return;
    }

    logsOutput.innerHTML = "";
    filtered.reverse().forEach(entry => {
      const div = document.createElement("div");
      div.classList.add("logEntry");
      div.innerHTML = formatLog(entry, logType);
      logsOutput.appendChild(div);
    });

  } catch(err) {
    console.error(err);
    logsOutput.innerHTML = "<p class='placeholder'>Erreur lors du chargement des logs.</p>";
  }
}

// Écouteurs sur les sélecteurs
logSelectors.forEach(sel => {
  sel.addEventListener("click", () => displayLogs(sel.dataset.log));
});

// Filtrage par bouton
document.getElementById("applyFilter").addEventListener("click", () => {
  if (currentLogType) displayLogs(currentLogType);
});

// Filtrage en appuyant sur Enter
logTargetInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && currentLogType) displayLogs(currentLogType);
});
