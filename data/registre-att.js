// scripts/registre-att.js

let selectedMember = null;
let attack1 = null;
let attack2 = null;

// 🧍 Ouvre la modale avec les infos du joueur
function openAttackModal(card) {
  selectedMember = card.getAttribute("data-name");
  attack1 = card.getAttribute("data-attack1");
  attack2 = card.getAttribute("data-attack2");

  document.getElementById("modalName").innerText = selectedMember;
  document.getElementById("attackModal").style.display = "flex";

  // Réinitialise la zone de texte
  document.getElementById("modalAttack").innerText = "Aucune attaque sélectionnée.";
}

// ❌ Ferme la modale
function closeAttackModal() {
  document.getElementById("attackModal").style.display = "none";
}

// 📜 Affiche les infos de l’attaque 1 ou 2
function showAttack(num) {
  const detail = num === 1 ? attack1 : attack2;
  document.getElementById("modalAttack").innerText = detail;
}

// 🎯 Ajout des écouteurs
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("viewAttack1Btn").addEventListener("click", () => showAttack(1));
  document.getElementById("viewAttack2Btn").addEventListener("click", () => showAttack(2));
});

// Ferme la modale si on clique à l’extérieur
window.addEventListener("click", (e) => {
  const modal = document.getElementById("attackModal");
  if (e.target === modal) closeAttackModal();
});