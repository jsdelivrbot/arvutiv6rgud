const express = require('express');
const app = express();
const https = require('https');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const md5File = require('md5-file/promise');
const fs = require("fs");
const pgp = require('pg-promise')();
pgp.pg.defaults.ssl = true;

const db = pgp(process.env.DATABASE_URL);
const resultsUrl = "https://www.ttu.ee/public/i/infotehnoloogia-teaduskond/Instituudid/automaatikainstituut/oppeained/ReinP/Kontrollerid/ISP0040_Hinne_nimedeta_2017_kevad.pdf";
const localFileName = "results.pdf";
let lastModTS = 0;
let lastModHash = "";
let lastChkTS = Date.now();
let clients = {};

function log(data) {
    console.log(Date.now().toString() + ' => ' + data);
}

// Getting initial stats on start of webserver
db.one('SELECT * FROM stats;', [true])
    .then(function(data) {
        lastModHash = data.mod_hash;
        lastModTS = parseInt(data.mod_ts);
        log('Last version hash: ' + lastModHash);
        log('Last version TS: ' + lastModTS);
    })
    .catch(function(error) {
        log(error);
    });

function updateInitialStats(newModTS, newModHash) {
    db.none('INSERT INTO stats(mod_ts, mod_hash) VALUES($1, $2)', [newModTS, newModHash])
        .then(() => {
            log('new stats inserted to database');
        })
        .catch(error => {
            log(error);
        });
}

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

function download(url, dest, cb) {
    let file = fs.createWriteStream(dest);
    https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    }).on('error', function(err) {
        fs.unlink(dest);
        log(err.message);
    });
}

function announceGlobally(event, data) {
    for (let id in clients) {
        clients[id].emit(event, data);
    }
}

function currentOnline() {
    return Object.keys(clients).length;
}

io.on('connection', function(socket) {
    log('connected: ' + socket.id);
    clients[socket.id] = socket;
    announceGlobally('online', { online: currentOnline() });
    log('online: ' + currentOnline());
    socket.emit('update', { updated: false, modTS: lastModTS, updTS: lastChkTS });

    socket.on('disconnect', function() {
        delete clients[socket.id];
        log('disconnected: ' + socket.id);
        log('online: ' + currentOnline());
        announceGlobally('online', { online: currentOnline() });
    });
});

setInterval(function() {
    log('checking for update...');
    download(resultsUrl, localFileName, function() {
        md5File(localFileName).then(md5 => {
            md5 = md5.toLowerCase();
            lastModHash = lastModHash.toLowerCase();
            lastChkTS = Date.now();
            if (md5 !== lastModHash) {
                log('results updated!');
                log('MD5O: ' + lastModHash);
                log('MD5N: ' + md5);
                lastModHash = md5;
                lastModTS = lastChkTS;
                updateInitialStats(lastModTS, lastModHash);
                announceGlobally('update', { updated: true, modTS: lastModTS, updTS: lastChkTS });
            } else {
                announceGlobally('update', { updated: false, modTS: lastModTS, updTS: lastChkTS });
                log('no updates found');
            }
        });
    });
}, 60000);

server.listen(app.get('port'));