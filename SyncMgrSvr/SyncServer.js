////// Constants 
var DIRECTORY_SYNCNEEDED = './MatchData_SyncNeeded/';
var DIRECTORY_SYNCD = './MatchData_Syncd/';
var DIRECTORY_TOMERGE = './MatchData_ToMerge/';
var DIRECTORY_MERGED = './MatchData_Merged/';
var FILE_SVR_IP = '192.168.2.185'; //'localhost';
var FILE_SVR_PORT = '8084';
var FILE_RCV_PORT = '8083';

////// Required libraries
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const move = require('./lib/move');

var io = require('socket.io').listen(FILE_RCV_PORT);

const port = process.argv[2] || FILE_SVR_PORT;

// sender.js
var socket = require('socket.io-client')('http://' + FILE_SVR_IP + ':' + FILE_SVR_PORT);
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
    });
})

io.sockets.on('connection', function(socket) {
    console.log('creating socket for listening');
    var delivery = dl.listen(socket);

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
})