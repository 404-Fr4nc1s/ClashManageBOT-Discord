// -------------------- members.js (static copy) --------------------

let selectedMember = null;
let selectedDiscordId = null;

// 🧍 Ouvre la modale principale du membre
function openMemberModal(card) {
  const name = card.getAttribute("data-name");
  const th = card.getAttribute("data-th");
  const trophies = card.getAttribute("data-trophies");
  const war = card.getAttribute("data-war");
  const role = card.getAttribute("data-role");
  const discordId = card.getAttribute("data-discord-id");

  selectedMember = name;
  selectedDiscordId = discordId;

  document.getElementById("modalName").innerText = name;
  document.getElementById("modalTh").innerText = th;
  document.getElementById("modalTrophies").innerText = trophies;
  document.getElementById("modalWar").innerText = war;
  document.getElementById("modalRole").innerText = role;

  document.getElementById("memberModal").style.display = "flex";
}

// ❌ Ferme la modale principale
function closeMemberModal() {
  document.getElementById("memberModal").style.display = "none";
}

// 🪄 Ouvre la pop-up d’attribution d’attaque
function openAssignModal() {
  if (!selectedMember) {
    alert("Veuillez d’abord sélectionner un membre.");
    return;
  }

  document.getElementById("selectedMemberName").innerText = `Membre : ${selectedMember}`;
  document.getElementById("assignModal").style.display = "flex";
}

// ❌ Ferme la pop-up d’attribution d’attaque
function closeAssignModal() {
  document.getElementById("assignModal").style.display = "none";
}

// ✅ Confirme et envoie l’attaque au bot Discord (dans la version statique, cette requête peut ne pas fonctionner)
async function confirmAssign() {
  const hdvNumber = document.getElementById("hdvNumber").value.trim();

  if (!hdvNumber) {
    alert("Merci d’entrer un numéro d’HDV.");
    return;
  }

  try {
    const res = await fetch("/assign-attack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberName: selectedMember,
        discordId: selectedDiscordId,
        hdvNumber,
      }),
    });

    const data = await res.text();

    if (res.ok) {
      alert("✅ Attaque attribuée avec succès !");
      closeAssignModal();
      closeMemberModal();
    } else {
      alert("❌ Erreur : " + data);
    }
  } catch (err) {
    console.error("Erreur d’envoi :", err);
    alert("❌ Une erreur est survenue lors de l’attribution.");
  }
}

// 🎯 Ajout des écouteurs
document.addEventListener("DOMContentLoaded", () => {
  // Bouton "Attribuer une attaque"
  const assignBtn = document.querySelector(".assign-attack-btn");
  if (assignBtn) assignBtn.addEventListener("click", openAssignModal);

  // Boutons de la deuxième modale
  const confirmBtn = document.getElementById("confirmAssignBtn");
  const cancelBtn = document.getElementById("cancelAssignBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmAssign);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAssignModal);
});

// Ferme les modales si on clique à l’extérieur
window.addEventListener("click", (e) => {
  const memberModal = document.getElementById("memberModal");
  const assignModal = document.getElementById("assignModal");

  if (e.target === memberModal) closeMemberModal();
  if (e.target === assignModal) closeAssignModal();
});
