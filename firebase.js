var firebase = require('firebase');

firebase.initializeApp({
  "serviceAccount": "./firebase.json",
  "databaseURL": "https://docx-26a65.firebaseio.com/"
});
module.exports.firebase = firebase;