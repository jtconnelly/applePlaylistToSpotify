# Apple Playlist to Spotify

James Connelly. 

## Description

I designed this node app out of necessity: My Apple Music subscription went down unexpectedly, and had thousands of songs that I no longer had access to. Because of that, I started working on this converter to be able to continue listening to my same playlists but on Spotify. 

This application uses a node package that interfaces directly with Spotify's Web API to be able to create and populate playlists. 

## How to Use

To use this application as-is, follow these steps

### What You Need

- Access to Apple Music and Apple Shortcuts
- node js and npm (node package manager to initialize the node js project, should be included with your node installation)
- [OPTIONAL] VSCode
- A premium Spotify account (When I started this, this was not a requirement)

### What you do

1. Create a shortcut that will get an apple playlist and put your songs in a text file in the format of `song,artist` (I'm working on changing the delimiter but have not gotten there yet)
2. Go to [Spotify Developers Site](developer.spotify.com), log into your account and create an Application. For the application, make sure you: 
    - Set Redirect URIs to `http://127.0.0.1:4000/callback`
    - Check the box for Web API under "APIs used"
3. Copy the Client ID, Client Secret, and Redirect URI to a file called `.env` to look like: 
    ```env
    CLIENT_ID="myid123"
    CLIENT_SECRET="mysecret123"
    REDIRECT_URI="http://127.0.0.1:4000/callback"
    ```
4. After this, type `npm install` into a command line in the top of the folder, after this installs the packages, you can then run the application.
5. You can run the application using either `node ./index.js` in your Command Line or using VSCode to run it for you. 
6. On your browser, open [http://127.0.0.1:4000/login](http://127.0.0.1:4000/login). This will log in and create a token for you to be able to use the app. The text will change on the screen and the application will look like it's idling as it waits for a reply. This wait is actually just waiting for all of your playlists to be created and populated. Once this completes check your Spotify, they should be there!

NOTE: I would check the output from either your command line or VSCode Debug output, you might find some tracks are missed, they will be highlighted with the text "Track Not Found". Most songs it will be because of how Spotify lays out their artists vs songs, such as having featured artists just as separate artists and not as "(Feat. )", or it will be because the song actually does not exist (I have only seen this once)
