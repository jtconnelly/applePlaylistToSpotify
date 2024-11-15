const express = require("express");
var SpotifyWebAPI = require("spotify-web-api-node");
const {readFiles} = require("./readFiles");
const request = require("request");

const clientID = "68490411d2014a33bfe374154e49757d";
const clientSECRET = "09517ee015974a29864ead2db5092be5";
const redirectUri = "localhost:4000/callback";

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
var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(clientID + ':' + clientSECRET).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };
  
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var token = body.access_token;
    }
  });
// console.log(playListDict);
var spotify = new SpotifyWebAPI({
    clientId: clientID,
    clientSecret: clientSECRET,
    redirectUri, redirectUri
});
spotify.clientCredentialsGrant().then(
    function(tokenData)
    {
        spotify.setAccessToken(tokenData.body.access_token);
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
    },
    function(tokenError)
    {
        console.error("Failed to retrieve token: "+err);
    }
);