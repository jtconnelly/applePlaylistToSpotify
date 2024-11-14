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
            playlistDict[file] = data;
        }
        catch(err)
        {
            console.error(err);
        }
    }
}

module.exports = { readFiles }