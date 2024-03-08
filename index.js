const express = require('express');
const { json } = require('express');
const fs = require('fs-extra');
const path = require('path');
 
const app = express();
const PORT = 800; 
const DATA_FILE_PATH = path.join(__dirname, 'data', 'videos.json');
const STATIC_ASSETS_PATH = path.join(__dirname, 'public', 'images');
const VIDEO_DETAILS_FILE_PATH = path.join(__dirname, 'routes', 'videos-details.json');

app.use(express.json());
app.use(express.static(STATIC_ASSETS_PATH));

let videosData = [];

async function loadVideosData() {
    try {
        const data = await fs.readFile(DATA_FILE_PATH);
        videosData = JSON.parse(data);
    } catch (error) {
        console.error('Error loading videos data:', error);
    }
}

async function saveVideosData() {
    try {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(videosData, null, 2));
    } catch (error) {
        console.error('Error saving videos data:', error);
    }
}

app.get('/videos', async (req, res) => {
    await loadVideosData();
    res.json(videosData.map(({id, title, channel, image}) => ({id, title, channel, image})))
});

app.get('/videos/:id', async (req, res) => {
    await loadVideosData();
    const video = videosData.find(video => video.id ===req.params.id);

    if (video) {
        res.json(video);
    } else {
        res.status(404).json({message: 'No video with that id exists'});
    }
});

// Video details path
app.get('/videos/:id', async (req, res) => {
    const videoId = req.params.id;

    try {
        const videoDetails = await loadVideoDetails(videoId);

        res.json(videoDetails);
    } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).json({message: 'Internal Server Error' });
    }
})

async function loadVideoDetails(videoId) {
    try {
        // Read the contents of videos-details.json
        const data = await fs.readFile(VIDEO_DETAILS_FILE_PATH, 'utf-8');
        const videosDetails = JSON.parse(data);
        
        // Find the video details based on the provided video ID
        const videoDetails = videosDetails.find(video => video.id === videoId);
        
        if (videoDetails) {
            return videoDetails;
        } else {
            throw new Error('Video not found');
        }
    } catch (error) {
        throw error;
    }
}

app.post('/videos', async (req, res) => {
    const newVideo = req.body;
    newVideo.id = Math.random().toString(36).substr(2, 9);
    
    if (!newVideo.image) {
        newVideo.image = '/images/default-thumbnail.jpg';
    }
    videosData.push(newVideo);
    await saveVideosData();
    res.status(201).json(newVideo);
});


app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await loadVideosData();
});