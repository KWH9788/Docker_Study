const express = require("express");
const http = require("http");
const mongodb = require("mongodb");

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
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

function main() {
    return mongodb.MongoClient.connect(DBHOST)
        .then(client => {
            const db = client.db(DBNAME);
            const videosCollection = db.collection("videos");

            app.get("/video", (req, res) => {
                const videoId = new mongodb.ObjectId(req.query.id);
                console.log(videoId);
                videosCollection.findOne({ _id: videoId })
                    .then(videoRecord => {
                        console.log(videoRecord);
                        if(!videoRecord) {
                            res.sendStatus(404);
                            return;
                        }
                        console.log(`Translated id ${videoId} to path ${videoRecord.videoPath}.`);
        
                        const forwardRequest = http.request( // Forward the request to the video storage microservice.
                            {
                                host: VIDEO_STORAGE_HOST,
                                port: VIDEO_STORAGE_PORT,
                                path:`/video?path=${videoRecord.videoPath}`, // Video path now retrieved from the database.
                                method: 'GET',
                                headers: req.headers
                            }, 
                            forwardResponse => {
                                res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                                forwardResponse.pipe(res);
                            }
                        );
                        
                        req.pipe(forwardRequest);
                    })
                    .catch(err => {
                        console.error("Database query failed.");
                        console.error(err && err.stack || err);
                        res.sendStatus(500);
                    });
            });

            //
            // Starts the HTTP server.
            //
            app.listen(PORT, () => {
                console.log(`Microservice listening, please load the data file db-fixture/videos.json into your database before testing this microservice.`);
            });
        });
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });