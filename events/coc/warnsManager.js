// // utils/warnsManager.js
// const fs = require('fs');
// const path = require('path');
// const warnsPath = path.join(__dirname, '../../data/warns.json');
// const { v4: uuidv4 } = require('uuid');

// // Charger les données depuis le fichier JSON
// function loadWarns() {
//   if (!fs.existsSync(warnsPath)) return {};
//   return JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
// }

// // Sauvegarder les données dans le fichier JSON
// function saveWarns(data) {
//   fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2));
// }

// // Ajouter un avertissement
// function addWarn(tag, raison, statut) {
//   const warns = loadWarns();
//   const code = uuidv4().slice(0, 8).toUpperCase();
//   const date = new Date().toISOString();

//   if (!warns[tag]) {
//     warns[tag] = { statut: "Dans le clan", warns: [] };
//   }

//   warns[tag].warns.push({ code, raison, date });

//   if (statut) warns[tag].statut = statut;

//   saveWarns(warns);
//   return code;
// }

// // Supprimer un avertissement
// function removeWarn(code, statut) {
//   const warns = loadWarns();
//   for (const tag in warns) {
//     const index = warns[tag].warns.findIndex(w => w.code === code);
//     if (index !== -1) {
//       warns[tag].warns.splice(index, 1);
//       if (statut) warns[tag].statut = statut;
//       saveWarns(warns);
//       return true;
//     }
//   }
//   return false;
// }

// // Changer le statut d’un joueur
// function toggleStatut(tag) {
//   const warns = loadWarns();
//   if (!warns[tag]) return null;
//   warns[tag].statut = warns[tag].statut === "Dans le clan" ? "Banni du clan" : "Dans le clan";
//   saveWarns(warns);
//   return warns[tag].statut;
// }

// module.exports = {
//   loadWarns,
//   addWarn,
//   removeWarn,
//   toggleStatut
// };