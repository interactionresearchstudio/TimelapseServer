const express = require('express');
const fileUpload = require('express-fileupload');
const randomstring = require('randomstring');
const videoshow = require('videoshow');
const fs = require('fs');
const http = require('http');
const app = express();

// App setup
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());

var uploadPath = 'public/uploads/';

// Post
app.post('/uploadFiles', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');

    var numOfFilesUploaded = 0;

    // Make directory for new upload
    var currentFolderName = randomstring.generate(8);
    fs.mkdir(uploadPath + currentFolderName, function(){
        console.log('INFO - Created new directory with random name ' + currentFolderName);
    });

    // Move all files to public directory
    console.log('INFO - found ' + req.files.uploadedImages.length + ' files.');
    for(var i=0; i < req.files.uploadedImages.length; i++) {
        imageName = req.files.uploadedImages[i].name;
        console.log('INFO - Image name: ' + imageName);
        req.files.uploadedImages[i].mv(uploadPath + currentFolderName +
            '/' + currentFolderName + '-' + imageName, function(err) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
        });
        numOfFilesUploaded++;
        console.log("INFO - Saved " + req.files.uploadedImages[i].name + " to public folder.");
    }

    fs.readdir(uploadPath + currentFolderName, function(err, files) {
        for(var i=0; i<files.length; i++) {
            files[i] = uploadPath + currentFolderName + '/' + files[i];
            console.log('INFO - Item in directory: ' + files[i]);
        }
        var videoOptions = {
            fps: 25,
            loop: 0.3, // seconds
            transition: false,
            transitionDuration: 1, // seconds
            videoBitrate: 1024,
            videoCodec: 'libx264',
            size: '1920x?',
            audioBitrate: '128k',
            audioChannels: 2,
            format: 'mp4',
            pixelFormat: 'yuv420p'
        }
        videoshow(files, videoOptions)
            .save(uploadPath + currentFolderName + '/' + currentFolderName + '.mp4')
            .on('start', function(command) {
                console.log('INFO - ffmpeg process started.')
            })
            .on('error', function (err, stdout, stderr) {
                console.error('Error:', err)
                console.error('ffmpeg stderr:', stderr)
            })
            .on('end', function (output) {
                console.log('INFO - Video created in:', output)
            })
    });

    res.send(numOfFilesUploaded + " files uploaded!");
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Node version: ' + process.versions.node);
    console.log('Server listening on port ' + app.get('port'));
})
