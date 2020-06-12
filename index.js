// Legion TD 2 Ladder Parser:
// Reads a json containing game events and writes the most recent overallElo of each player to an output json.
// Download input files for each season: https://drive.google.com/drive/folders/1NIlguHLU3tP4_e5pTMQm75F-fMPIL6_s
// Author: GvR Mr Mister
// Github: https://github.com/Shoro2/ltd2_ladder_parser
// Config:
const SEASON        =   2
const PATH_INPUT    =   "input/season" + SEASON + ".json";
const PATH_OUTPUT   =   "output/ladders" + SEASON + ".json";
//
const fs = require('fs');
var players = [];
try{
    var stream = fs.createReadStream(PATH_INPUT, {flags: 'r', encoding: 'utf-8'});
}
catch(err){
    console.log("Failed to open " + PATH_INPUT + ". Error: " + err);
}

var buf = '';

stream.on('data', function(d) {
    buf += d.toString(); // when data is read, stash it in a string buffer
    pump(); // then process the buffer
});

stream.on('close', function(){
    // sort by elo and write to output file
    players.sort((a, b) => (a.elo > b.elo) ? -1 : 1)
    console.log("Total players: " + players.length);
    console.log(players[0]);
    console.log(players[players.length - 1]);
    var rank = 1;
    try{
        players.forEach(ele =>{
            ele.rank = rank;
            rank++;
            // OUTPUT
            fs.appendFileSync(PATH_OUTPUT, JSON.stringify(ele) + "\r\n");
        });
    }
    catch(err){
        console.log("Failed to write to " + PATH_OUTPUT + ". Error: " + err);
    }
});

function pump() {
    var pos;
    while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
        if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
            buf = buf.slice(1); // discard it
            continue; // so that the next iteration will start with data
        }
        processLine(buf.slice(0, pos)); // hand off the line
        buf = buf.slice(pos + 1); // and slice the processed data off the buffer
    }
}

function processLine(line) { // here's where we do something with a line
    if (line[line.length - 1] == '\r') line = line.substr(0, line.length - 1); // discard CR (0x0D)
    if (line.length > 0) { // ignore empty lines
        var obj = JSON.parse(line); // parse the JSON
        obj.gameDetails.forEach(ele =>{
            // some players overallElo is 0...
            if(ele.overallElo > 0){
                // create new object
                if(!players.find(x => x.name === ele.playername)){
                    // ts = last game played this season
                    players.push({name: ele.playername, elo: ele.overallElo, ts: obj.ts});
                }
                // update existing object
                else{
                    var player = players[players.findIndex(x => x.name === ele.playername)];
                    if(obj.ts > player.ts){
                        player.elo = ele.overallElo;
                        player.ts = obj.ts;
                    }
                }
            }
        });
    }
}