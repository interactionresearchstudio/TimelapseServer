const express = require('express');
const fileUpload = require('express-fileupload');
const randomstring = require('randomstring');
const videoshow = require('videoshow');
const fs = require('fs');
const async = require('async');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);

// App setup
app.set('port', process.env.PORT || 8080);
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());

var uploadPath = 'public/uploads/';

function makeMP4(directory, outputName, duration, socketID) {
    fs.readdir(directory, function(err, files) {
        for(var i=0; i<files.length; i++) {
            files[i] = directory + '/' + files[i];
            console.log('INFO - Item in directory: ' + files[i]);
        }
        var videoOptions = {
            fps: 25,
            loop: duration, // seconds
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
            .save(directory + '/' + outputName + '.mp4')
            .on('start', function(command) {
                console.log('INFO - ffmpeg process started.')
            })
            .on('error', function (err, stdout, stderr) {
                console.error('Error:', err)
                console.error('ffmpeg stderr:', stderr)
                return '';
            })
            .on('end', function (output) {
                console.log('INFO - Video created in:', output)
                //resultObject.download(directory + '/' + outputName + '.mp4');
                io.sockets.connected[socketID].emit("downloadMP4", "uploads/" + outputName + "/" + outputName + '.mp4');
                return directory + '/' + outputName + '.mp4';
            })
    });
}

function downloadGIF(directory, outputName, duration, resultObject) {

}

// Post
app.post('/uploadFiles', function(req, res) {
    if (!req.files) return res.status(400).send('No files were uploaded.');

    //console.log('INFO - Output type: ' + req.body.outputType);

    var numOfFilesUploaded = 0;

    // Make directory for new upload
    var currentFolderName = randomstring.generate(8);
    fs.mkdir(uploadPath + currentFolderName, function(){
        console.log('INFO - Created new directory with random name ' + currentFolderName);
    });

    // Move all files to public directory
    console.log('INFO - found ' + req.files.images.length + ' files.');
    for(var i=0; i < req.files.images.length; i++) {
        imageName = req.files.images[i].name;
        console.log('INFO - Image name: ' + imageName);
        req.files.images[i].mv(uploadPath + currentFolderName +
            '/' + currentFolderName + '-' + imageName, function(err) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
        });
        numOfFilesUploaded++;
        console.log("INFO - Saved " + req.files.images[i].name + " to public folder.");
    }

    if (numOfFilesUploaded == req.files.images.length) {
        console.log("Finished uploading files.");
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ id: currentFolderName }));
    }

    /*
    // Download file
    if (req.body.outputType == 'mp4')
        downloadMP4(uploadPath + currentFolderName, currentFolderName, parseFloat(req.body.frameDelay), res);
    */
});

server.listen(app.get('port'), function() {
    console.log('Node version: ' + process.versions.node);
    console.log('Server listening on port ' + app.get('port'));
})

io.on('connection', function(socket) {
    socket.on('makeMP4', function(data) {
        console.log("Starting MP4 with id " + data.id);
        makeMP4(uploadPath + data.id, data.id, parseFloat(data.frameDelay), socket.id);
    });
});
