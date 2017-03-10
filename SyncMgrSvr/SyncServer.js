////// Constants 
var DIRECTORY_SYNCNEEDED = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_SyncNeeded/';
var DIRECTORY_SYNCD = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_Syncd/';
var DIRECTORY_TOMERGE = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_ToMerge/';
var DIRECTORY_MERGED = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_Merged/';
var MASTER_FILE = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/Master_MatchData.csv';

//var FILE_SVR_IP = '192.168.2.185'; //'localhost';
// Azure svr IP is listening on port 8083
var AZURE_SVR_IP = '13.84.164.187';
var AZURE_SVR_PORT = '8083';
var FILE_RCV_PORT = '8083';
var FILE_SVR_PORT = '8084';

////// Required libraries
var express = require('express');
var app = express();
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const move = require('./lib/move');

var io = require('socket.io').listen(FILE_RCV_PORT);

// sender.js
var socket = require('socket.io-client')('http://' + AZURE_SVR_IP + ':' + AZURE_SVR_PORT);
var dl = require('delivery');
var async = require('async');
var csvstr = '';

// homepage
app.get('/', function(req, res) {
    console.log('Index Home Page');
    fs.readFile('MergeFile.html', function(err, page) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(page);
        res.end();
    });
});
app.get('/mergehome', function(req, res) {
    console.log('Home Page');
    fs.readFile('MergeFile.html', function(err, page) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(page);
        res.end();
    });
});
app.get('/mergefile_execute', function(req, res) {
    console.log('Merge File Execute');
    MergeFiles();
    fs.readFile('MergeFileComplete.html', function(err, page) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(page);
        res.end();
    });

});

var server = app.listen(FILE_SVR_PORT, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("Listening at http://%s:%s", host, port);
})

function MergeFiles() {

    // merge all files into master file
    //fs.readdirsync(DIRECTORY_TOMERGE);
    fs.readdir(DIRECTORY_TOMERGE, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function(filename) {
            //async.eachSeries(files, function(filename, cb) {
            console.log('Merging File: ', filename);
            // Read file f and append to MasterFile
            csvstr = fs.readFileSync(DIRECTORY_TOMERGE + "/" + filename);
            //console.log('File Contents: ' + csvstr);
            // write or append data to file
            fs.appendFileSync(MASTER_FILE, csvstr, 'utf8');
            fs.appendFileSync(MASTER_FILE, '\n');
            // file transferred - move it to SYNCD
            move(DIRECTORY_TOMERGE + filename, DIRECTORY_MERGED + filename, function(err) {
                console.log(err);
            });
        });
    });
}

socket.on('connect', function() {
    var delivery = dl.listen(socket);
    delivery.connect()

    console.log('----connected----')

    delivery.on('delivery.connect', function(delsocket) {
        console.log('delivery connected')

        delsocket.on('send.success', function(fileUID) {
            console.log("file was successfully sent.", fileUID);
        });

        // if files to send move files from sync needed to sync'd
        fs.readdir(DIRECTORY_SYNCNEEDED, function(err, files) {
            async.eachSeries(files, function(f, cb) {
                console.log('called', f)
                delivery.send({
                    name: f,
                    path: DIRECTORY_SYNCNEEDED + f
                })
                cb();
                // file transferred - move it to SYNCD
                move(DIRECTORY_SYNCNEEDED + f, DIRECTORY_SYNCD + f, function(err) {
                    console.log(err);
                });
            });
        });
        // if file to receive - save them to MatchData_Mergeddelivery.on('receive.success', function(file) {
        delivery.on('receive.success', function(file) {
            fs.writeFile(DIRECTORY_TOMERGE + file.name, file.buffer, function(err) {
                if (err) {
                    console.log('File could not be saved.', file.uid, file.name);
                } else {
                    console.log('File saved.', file.uid, file.name);
                };
            });
        });
    });
})