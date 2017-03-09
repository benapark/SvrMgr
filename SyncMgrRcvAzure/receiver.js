////// Constants 
var DIRECTORY_SYNCNEEDED = './MatchData_SyncNeeded/';
var DIRECTORY_SYNCED = './MatchData_Syncd/';
var DIRECTORY_TOMERGE = './MatchData_ToMerge/';
var DIRECTORY_MERGED = './MatchData_Merged/';
var FILE_SVR_IP = 'localhost';
var FILE_SVR_PORT = '8083';

var io = require('socket.io').listen(FILE_SVR_PORT);
var dl = require('delivery');
var fs = require('fs');


// this side needs to be on Azure
io.sockets.on('connection', function(socket) {
    console.log('creating socket for listening');
    var delivery = dl.listen(socket);

    delivery.on('receive.success', function(file) {
        fs.writeFile(DIRECTORY_TOMERGE + file.name, file.buffer, function(err) {
            if (err) {
                console.log('File could not be saved.', file.uid, file.name);
            } else {
                console.log('File saved.', file.uid, file.name);
            };
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
    console.log('Not receiveing...');
});