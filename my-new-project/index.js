const express = require("express");
const http = require("http");

const app = express();

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.AZURE_STORAGE_HOST) {
    throw new Error("Please specify the host name for the video storage microservice in variable VIDEO_STORAGE_HOST.");
}

if (!process.env.AZURE_STORAGE_PORT) {
    throw new Error("Please specify the port number for the video storage microservice in variable VIDEO_STORAGE_PORT.");
}

const PORT = process.env.PORT; // 사용할 포트
const VIDEO_STORAGE_HOST = process.env.AZURE_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.AZURE_STORAGE_PORT);
console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

app.get("/video", (req, res) => {
    const forwardRequest = http.request( // Forward the request to the video storage microservice.
        {
            host: VIDEO_STORAGE_HOST,
            port: VIDEO_STORAGE_PORT,
            path: '/video?path=SampleVideo_1280x720_1mb.mp4', // Video path is hard-coded for the moment.
            method: 'GET',
            headers: req.headers
        }, 
        forwardResponse => {
            res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
            forwardResponse.pipe(res);
        }
    );
    
    req.pipe(forwardRequest);
});

app.listen(PORT, () => {
    console.log(`Microservice online`);
});