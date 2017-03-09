////// Constants 
var DIRECTORY_SYNCNEEDED = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_SyncNeeded/';
var DIRECTORY_SYNCD = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_Syncd/';
var DIRECTORY_TOMERGE = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_ToMerge/';
var DIRECTORY_MERGED = '/Users/et0165154/Documents/Biomic Tigers Robotics/SvrMgr/MatchData_Merged/';
//var FILE_SVR_IP = '192.168.2.185'; //'localhost';
// Azure svr IP is listening on port 8083
var AZURE_SVR_IP = '13.84.164.187';
var AZURE_SVR_PORT = '8083';
var FILE_RCV_PORT = '8083';

////// Required libraries
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