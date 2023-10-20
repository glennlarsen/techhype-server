const crypto = require("crypto");
function generateCardUrl(userId, username) {
    // Generate a random string or number, e.g., timestamp or random characters
    const randomPart = crypto.randomBytes(6).toString("hex");

    // Combine the user's username and the random part
    return `https://techhype.netlify.app/${userId}/${username}/${randomPart}`;
}

module.exports = generateCardUrl;
