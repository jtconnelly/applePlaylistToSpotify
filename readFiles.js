const fs = require("fs")

function readFiles(dirName, playlistDict)
{
    var files = fs.readdirSync(dirName);
    for (var file of files)
    {
        try
        {
            if (!file.endsWith(".txt"))
            {
                continue;
            }
            const data = fs.readFileSync(dirName + file, "utf-8");
            playlistDict[file] = []
            var songs = data.split("\n");
            for (var song of songs)
            {
                // console.log("Data response: " + playlistData.body);
                var artist = song.split(",").slice(-1);
                var title = song.split(",").slice(0,-1);
                var obj = new Object();
                obj.artist = artist;
                obj.name = title;
                playlistDict[file].push(obj);
            }
        }
        catch(err)
        {
            console.error(err);
        }
    }
}

module.exports = { readFiles }