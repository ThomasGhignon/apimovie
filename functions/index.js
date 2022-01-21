const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const routerMovies = require("./router/movies.js")
const routerCategories = require("./router/categories.js")

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();


const app = express();

app.use(express.json())

app.use("/v1", routerMovies(db));
app.use("/v1", routerCategories(db));

exports.api = functions.region("europe-west3").https.onRequest(app);
