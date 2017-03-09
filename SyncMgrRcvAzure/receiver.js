////// Constants 
var DIRECTORY_SYNCNEEDED = '/Users/1592/Documents/SvrMgr/MatchData_SyncNeeded/';
var DIRECTORY_SYNCD = '/Users/1592/Documents/SvrMgr/MatchData_Syncd/';
var DIRECTORY_TOMERGE = '/Users/1592/Documents/SvrMgr/MatchData_ToMerge/';
var DIRECTORY_MERGED = '/Users/1592/Documents/SvrMgr/MatchData_Merged/';

var AZURE_LISTEN_PORT = '8083';
var FILE_SVR_PORT = '8084';

var express = require('express');
var app = express();
var io = require('socket.io').listen(AZURE_LISTEN_PORT);
var dl = require('delivery');
var fs = require('fs');
var async = require('async');
const move = require('./lib/move');
var delayed = require('delayed');

// homepage
app.get('/', function(req, res) {
        console.log('Index Home Page');
        fs.readFile('synchome.html', function(err, page) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(page);
            res.end();
        });
    });
app.get('/synchome', function(req, res) {
        console.log('Home Page');
        fs.readFile('synchome.html', function(err, page) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(page);
            res.end();
        });
    });
app.get('/syncfiles_execute', function(req, res) {
        console.log('Sync File Execute');
        io.close();
        io.listen(AZURE_LISTEN_PORT);
        syncfiles();
        fs.readFile('synchome.html', function(err, page) {
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

function syncfiles() {
    // this side needs to be on Azure
    io.sockets.on('connection', function(socket) {
        console.log('creating socket for listening');
        var delivery = dl.listen(socket);


        delivery.on('delivery.connect', function(delsocket) {
            console.log('delivery connected')

            // if files to send move files from sync needed to sync'd
            fs.readdir(DIRECTORY_SYNCNEEDED, function(err, files) {
                async.eachSeries(files, function(f, cb) {
                    console.log('Sending File: ', f)
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
                delayed.delay(function () { 
                    console.log('Exiting...');  
                    process.exit(0);
                }, 30000);
            });
        });
        //console.log('Not receiveing...');
    });
}