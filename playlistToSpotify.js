const express = require("express");
var SpotifyWebAPI = require("spotify-web-api-node");
const {readFiles} = require("./readFiles");

var playListDict = {}
readFiles("./playliststocopy/", playListDict);

const app = express();
const port = 4000;

app.get('/', (req, res) => {
    res.send('Something else');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// console.log(playListDict);
var spotify = new SpotifyWebAPI();
for (var key in playListDict)
{
    var playlistTitle = key.split(".")[0];
    spotify.createPlaylist(playlistTitle, "copied from Apple Playlist using playlistToSpotify").then(
        function(playlistData)
        {
            var songs = playListDict[key].split("\n");
            for (var song of songs)
            {
                console.log("Data response: " + data.body);
                var artist = song.split(",").slice(-1);
                var title = song.split(",").slice(0,-1);
                var tracks = []
                spotify.searchTracks("track:"+title + " artist:" + artist, {limit : 1}).then(
                    function(data)
                    {
                        // We're only grabbing the first one, so just grab the uri for when we add to playlist
                        tracks.push(data.body.tracks.items[0].uri);
                    },
                    function(err)
                    {
                        console.error("Failed to pull song " + title + ": "+err);
                    }

                );
            }
            spotify.addTracksToPlaylist(playlistData.body.id, tracks).then(
                function(success)
                {
                    console.log("Successfully added to playlist " + playlistTitle);
                },
                function(err)
                {
                    console.error("Failed to add to playlist " + playlistTitle +": " + err);
                }
            );

        },
        function(err)
        {
            console.error("failed to create playlist " + playlistTitle + ": "+err);
        }
    );

}