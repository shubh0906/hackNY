const express = require('express');
const fs = require('fs');
var app = express();
const {detectText} = require('./index.js');
var bodyParser = require('body-parser');
var {firebase} = require("./firebase.js");
const language = require('@google-cloud/language');

// Creates a client
const client = new language.LanguageServiceClient();



app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var ref = firebase.app().database().ref();
//console.log(ref.child('images'));
var images = ref.child('images');

 images.on("child_added", function(snapshot) {
    var data = snapshot.val();
    var imageData = images.child(data.key);
    var questionSet = imageData.child("questions");
    var URL = data.downloadUrl;
    //console.log("\t\t\t\t\t\t\t\t out deleteText");
    if(data.content ==""){
        detectText(URL).then((messageData) => {
            //console.log("in deleteText"+JSON.stringify(messageData));
            imageData.update({
                "/content": messageData[0].text,
                '/from':messageData[0].from
               });
               messageData[0].text.split(".").forEach( (text) =>{
                   //console.log(text);
                const document = {
                    content: text,
                    type: 'PLAIN_TEXT',
                  };
                  client
                  .analyzeSyntax({document: document})
                  .then(results => {
                    const syntax = results[0];
                    
                    //console.log('Tokens:'+JSON.stringify(results));
                    syntax.tokens.forEach(part => {
                      if(part.partOfSpeech.tag==="NOUN" && part.partOfSpeech.proper ==="PROPER"){
                            var temp ={
                                question : text.replace(part.text.content,"dash"),
                                answer :part.text.content
                            };
                            questionSet.push(temp);
                            //console.log(temp);
                      }
                          //console.log(`${part.partOfSpeech.tag}: ${part.text.content} \n`, part.partOfSpeech);
                      //     console.log(part.partOfSpeech.tag);
  
                      //console.log(`${part.partOfSpeech.tag}: ${part.text.content}`);
                      //console.log(`Morphology:`, part.partOfSpeech);
                    });
                  })
                  .catch(err => {
                    console.error('ERROR:', err);
                  });
               });
            
             
            //console.log("ffffffffffffffffffffffffffffffffffff\n"+JSON.stringify(messageData[0].text));
            //res.send
        }).catch(err => console.log("error here"+err));
    }
    
  });


let port = 8080;
app.post('/text',(req, res) => {
    console.log(req.body);
    var URL = req.body.url;
    var imageData = images.child(req.body.key);
    imageData.once('value')
    .then(function (snap) {
    console.log('snap.val()', snap.val());
    });
    detectText(URL).then((messageData) => {
        imageData.update({
            "/content": messageData[0].text,
            '/from':messageData[0].from
           });
        console.log("ffffffffffffffffffffffffffffffffffff\n"+JSON.stringify(messageData[0].text));
    });
    //console.log(messageData)
});
app.get("/data/:title",(req,res) =>{
    var key = req.params.title;
    var data = images.orderByChild("title").equalTo(key).on("child_added",(snapshot) =>{
        res.status(200).send(snapshot.val().questions);
        //console.log(snapshot.val().questions);
    });
    // var imageData = images.child(key);
    // var questionSet = imageData.child("questions");
    // questionSet.once('value')
    // .then(function (snap) {
    //     res.status(200).send(snap.val());
    // //console.log('snap.val()', snap.val());
    // });
    
});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
  });
  
  module.exports = {app};