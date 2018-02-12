const express = require('express');
const fileUpload = require('express-fileupload');
const randomstring = require('randomstring');
const fs = require('fs');
const http = require('http');
const app = express();

// App setup
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());

// Post
app.post('/uploadFiles', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');
    //console.log(req.files.uploadedImages);

    var numOfFilesUploaded = 0;
    var randomFolderName = randomstring.generate(8);
    fs.mkdir('public/uploads/' + randomFolderName, function(){
        console.log('INFO - Created new directory with random name ' + randomFolderName);
    });

    console.log('INFO - found ' + req.files.uploadedImages.length + ' files.');
    for(var i=0; i < req.files.uploadedImages.length; i++) {
        imageName = req.files.uploadedImages[i].name;
        console.log('INFO - Image name: ' + imageName);
        req.files.uploadedImages[i].mv('public/uploads/' + randomFolderName +
            '/' + imageName, function(err) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
        });
        numOfFilesUploaded++;
        console.log("INFO - Saved " + req.files.uploadedImages[i].name + " to public folder.");
    }
    res.send(numOfFilesUploaded + " files uploaded!");
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Node version: ' + process.versions.node);
    console.log('Server listening on port ' + app.get('port'));
})
