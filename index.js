import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

const db = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432
});
db.connect();

let listFavoriteItems = [];

// Function to get Spotify access token
async function getSpotifyToken() {
    try {

        const response = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
                'grant_type': 'client_credentials'
            }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                ).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        throw error;
    }
}

app.get("/", async(req, res) => {
    try {
        // Get fresh token
        const token = await getSpotifyToken();
        
        const response = await db.query("SELECT * FROM tracks");
        listFavoriteItems = response.rows;

        const result = await axios.get('https://api.spotify.com/v1/playlists/2Yc5GXwVtX4Lsg4vKkCs5C', {
            headers: { Authorization: `Bearer ${token}`}
        });
  
        const playlistData = {
            name: result.data.name,
            description: result.data.description,
            cover_image: result.data.images[0].url,
            tracks: result.data.tracks.items.map(item => ({
                name: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
                duration: item.track.duration_ms,
                image: item.track.album.images[0]?.url,
            }))
            .filter(track => !listFavoriteItems.some(fav => fav.title === track.name && fav.artist === track.artist)),
        };

        console.log(listFavoriteItems)
        // console.log(result.data.tracks.items)
        res.render("index.ejs",{playlist: playlistData, favoritePlaylist: listFavoriteItems});
    } catch (error) {
        console.log(error);
        res.status(500).send("Error fetching data");
    }
});

app.post("/add", async(req, res)=>{
    const {track_name, track_artist, track_album, track_image, track_duration} = req.body;
    console.log(req.body)

    try {
        await db.query("INSERT INTO tracks (title, artist, album, image, duration, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",[
            track_name, track_artist, track_album, track_image, track_duration
        ]);
        console.log(`Added track: ${track_name} by ${track_artist}`);
        
        res.redirect("/")
    } catch (error) {
        console.error("Error inserting track:", error);
        res.status(500).send("Error adding track");
    }

});

app.post("/delete", async(req, res)=>{
    const {track_id} = req.body;
        await db.query("DELETE FROM tracks WHERE id = $1", [track_id]);
        console.log(`Deleted track ID: ${track_id}`);
        res.redirect("/");
    try {
        
    } catch (error) {
        console.error("Error deleting track", error);
        res.status(500).send("Error deleting track");
    }
});


app.listen(port,()=>{
    console.log(`The server is running on port: ${port}`);
});