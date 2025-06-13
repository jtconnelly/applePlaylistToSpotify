// Load environment variables from the .env file.
require('dotenv').config();

// Import the necessary modules.
const express = require('express');
const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const {readFiles} = require("./readFiles");

var playListDict = {}
readFiles("./playliststocopy/", playListDict);
// Initialize an Express application.
const app = express();
// Define the port number on which the server will listen.
const port = 4000;

// Initialize the Spotify API with credentials from environment variables.
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URL
});

// Function to search tracks
async function getTrackId(artist, title) {
  try {
    const data = await spotifyApi.searchTracks(`artist:${artist} track:${title}`, {limit : 1});
    return data.body.tracks.items.length > 0 ? data.body.tracks.items[0].id : null;
  } catch (error) {
    console.error('Error searching track:', error);
  }
}

async function resolveTracks(playlistKey)
{
    tracks = [];
    var songs = playListDict[playlistKey].split("\n");
    for (var song of songs)
    {
        // console.log("Data response: " + playlistData.body);
        var artist = song.split(",").slice(-1);
        var title = song.split(",").slice(0,-1);
        var track = await spotifyApi.searchTracks("track:"+title + " artist:" + artist, {limit : 1});
        if (track != null && track.body.tracks.items.length > 0)
        {
            tracks.push(track.body.tracks.items[0].uri);
        }
    }
    return tracks;
}

var tracksDict = {};

async function initTracksDict()
{
    for (var key in playListDict)
    {
        trackIds = [];
        for (var song of playListDict[key])
        {
            const trackId = await getTrackId(song.artist, song.name);
            if (trackId) {
                trackIds.push(trackId);
            } else {
                console.error(`Track not found: ${song.artist} - ${song.name}`);
            }
        }
        
        //const trackIds = await Promise.all(playListDict[key].map(song => getTrackId(song.artist, song.name)));
        tracksDict[key] = trackIds.filter(id => id); // Filter out null values
    }

}

app.get("/", (req, res) => {
    res.redirect("/login");
});

// Route handler for the login endpoint.
app.get('/login', (req, res) => {
    // Define the scopes for authorization; these are the permissions we ask from the user.
    const scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private', 'playlist-modify-public', 'user-read-playback-state', 'user-modify-playback-state'];
    // Redirect the client to Spotify's authorization page with the defined scopes.
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Route handler for the callback endpoint after the user has logged in.
app.get('/callback', (req, res) => {
    // Extract the error, code, and state from the query parameters.
    const error = req.query.error;
    const code = req.query.code;

    // If there is an error, log it and send a response to the user.
    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }
    const options = {
        root: path.join(__dirname)
    };
    // Exchange the code for an access token and a refresh token.
    spotifyApi.authorizationCodeGrant(code).then(async data => {
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        const expiresIn = data.body['expires_in'];

        // Set the access token and refresh token on the Spotify API object.
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        // Logging tokens can be a security risk; this should be avoided in production.
        console.log('The access token is ' + accessToken);
        console.log('The refresh token is ' + refreshToken);

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for a second to ensure the tokens are set.

        // Refresh the access token periodically before it expires.
        setInterval(async () => {
            const data = await spotifyApi.refreshAccessToken();
            const accessTokenRefreshed = data.body['access_token'];
            spotifyApi.setAccessToken(accessTokenRefreshed);
        }, expiresIn / 2 * 1000); // Refresh halfway before expiration.

        await initTracksDict();
        for (var key in tracksDict)
        {
            try
            {
                const playlistData = await spotifyApi.createPlaylist(key, {"description" : "copied from Apple Playlist using playlistToSpotify", "public" : false});
                console.log("Successfully created playlist " + key);
                const id = playlistData.body.id;
                const batches = await chunkArray(tracksDict[key], 50);
                for (const batch of batches)
                {
                    try
                    {
                        await spotifyApi.addTracksToPlaylist(id, tracksDict[key]);
                    }
                    catch (error)
                    {
                        console.error("Error adding tracks to playlist: ", error);
                    }
                }
            }
            catch (error)
            {
                console.error("Error creating playlist: ", error);
            }
        }

        res.redirect("/success");
    }).catch(error => {
        console.error('Error getting Tokens:', error);
        res.send('Error getting tokens');
    });
});

app.get("/success", (req, res) => {
    res.send("Finished copying all playlists to Spotify");
});

// Route handler for the search endpoint.
app.get('/search', (req, res) => {
    // Extract the search query parameter.
    const { q } = req.query;

    // Make a call to Spotify's search API with the provided query.
    spotifyApi.searchTracks(q).then(searchData => {
        // Extract the URI of the first track from the search results.
        const trackUri = searchData.body.tracks.items[0].uri;
        // Send the track URI back to the client.
        res.send({ uri: trackUri });
    }).catch(err => {
        console.error('Search Error:', err);
        res.send('Error occurred during search');
    });
});

// Route handler for the play endpoint.
app.get('/play', (req, res) => {
    // Extract the track URI from the query parameters.
    const { uri } = req.query;

    // Send a request to Spotify to start playback of the track with the given URI.
    spotifyApi.play({ uris: [uri] }).then(() => {
        res.send('Playback started');
    }).catch(err => {
        console.error('Play Error:', err);
        res.send('Error occurred during playback');
    });
});

app.get("/populate", (req, res) => {
    const { id, key } = req.query;
    var trackChunks = [];
    const chunkSize = 50;
    for (let i = 0; i < tracksDict[key].length; i += chunkSize){
        trackChunks.push(tracksDict[key].slice(i, i + chunkSize));
    }
    for (var chunk in trackChunks){
        spotifyApi.addTracksToPlaylist(id, chunk).then(
            function(success)
            {
                console.log("Successfully added chunk to playlist " + playlistTitle);
            },
            function(err)
            {
                console.error("Failed to add chunk to playlist " + playlistTitle +": " + err);
            }
        );
    }
    res.redirect("/callback");
});

app.get('/create', (req, res) => {
    const { name } = req.query;
    var error_count = 0;
    for (var key in playListDict)
    {
        var playlistTitle = key.split(".")[0];
        if (playlistTitle != name)
        {
            continue;
        }
        spotifyApi.createPlaylist(playlistTitle, {"description" : "copied from Apple Playlist using playlistToSpotify", "public" : false}).then(
            function(playlistData)
            {
                res.redirect("/populate?id="+playlistData.body.id+"&key="+key);
            },
            function(err)
            {
                console.error("failed to create playlist " + playlistTitle + ": "+err);
                error_count++;
            }
        );
    }
});

// Start the Express server.
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});