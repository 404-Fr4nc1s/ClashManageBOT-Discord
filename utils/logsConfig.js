const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/config/logsConfig.json");

function ensureFile() {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({
            messageDelete: null,
            messageUpdate: null,
            memberJoin: null,
            memberLeave: null,
            voice: null
        }, null, 2));
    }
}

function readConfig() {
    ensureFile();
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function writeConfig(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function setLogChannel(type, channelId) {
    const config = readConfig();
    config[type] = channelId;
    writeConfig(config);
    return config;
}

function getLogChannel(type) {
    const config = readConfig();
    return config[type];
}

module.exports = { readConfig, writeConfig, setLogChannel, getLogChannel };
