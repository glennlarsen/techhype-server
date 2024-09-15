const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.updateUserVerification = functions.auth.user().onUpdate((user) => {
  console.log('User updated:', user);
});
