var express = require('express');
var delivery = require('delivery');
var fs = require('fs');
var util = require('util');
var http = require('http');
var socket = require('socket.io-client');

// Constrants
var DIRECTORY_SYNCNEEDED = "C:\Users\et0165154\Documents\Biomic Tigers Robotics\SyncMgr\MatchData_SyncNeeded";
var DIRECTORY_SYNCED = "C:\Users\et0165154\Documents\Biomic Tigers Robotics\SyncMgr\MatchData_Synced";
var DIRECTORY_TOMERGE = "C:\Users\et0165154\Documents\Biomic Tigers Robotics\SyncMgr\MatchData_ToMerge";
var DIRECTORY_MERGED = "C:\Users\et0165154\Documents\Biomic Tigers Robotics\SyncMgr\MatchData_Merged";
var FILE_SVR_IP = "localhost";
var FILE_SVR_PORT = "8083";

socket.on('connect', function() {
    log("Sockets connected");

    delivery = dl.listen(socket);
    delivery.connect();

    delivery.on('delivery.connect', function(delivery) {
        delivery.send({
            name: 'Match_Data_3_2017_1488749202661_1592_5.csv',
            path: DIRECTORY_SYNCNEEDED + '/Match_Data_3_2017_1488749202661_1592_5.csv'
        });

        delivery.on('send.success', function(file) {
            console.log('File sent successfully!');
        });
    });

});