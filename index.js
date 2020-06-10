const fs = require('fs');
var players = [];
// INPUT
var stream = fs.createReadStream("input/season2.json", {flags: 'r', encoding: 'utf-8'});
var buf = '';

stream.on('data', function(d) {
    buf += d.toString(); // when data is read, stash it in a string buffer
    pump(); // then process the buffer
});

stream.on('close', function(){
    players.sort((a, b) => (a.elo > b.elo) ? -1 : 1)
    console.log("total players: "+players.length);
    console.log(players[0]);
    console.log(players[players.length -1]);
    var rank=1;
    players.forEach((ele) =>{
        ele.rank = rank;
        rank++;
        // OUTPUT
        fs.appendFileSync("output/ladders2.json", JSON.stringify(ele)+"\r\n");
    });
});

function pump() {
    var pos;
    while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
        if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
            buf = buf.slice(1); // discard it
            continue; // so that the next iteration will start with data
        }
        processLine(buf.slice(0,pos)); // hand off the line
        buf = buf.slice(pos+1); // and slice the processed data off the buffer
    }
}

function processLine(line) { // here's where we do something with a line
    if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)
    if (line.length > 0) { // ignore empty lines
        var obj = JSON.parse(line); // parse the JSON
        obj.gameDetails.forEach(function(ele){
            // some players overallElo is 0...
            if(ele.overallElo>0){
                // create new object
                if(!players.find(x => x.name === ele.playername)){
                    players.push({name: ele.playername, elo: ele.overallElo, ts: obj.ts});
                }
                // update existing object
                else{
                    if(obj.ts > players[players.findIndex(x => x.name === ele.playername)].ts){
                        players[players.findIndex(x => x.name === ele.playername)].elo = ele.overallElo;
                        players[players.findIndex(x => x.name === ele.playername)].ts = obj.ts;
                    }
                }
            }
        });
    }
}