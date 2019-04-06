var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
//var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

var db = mongoose.connect(MONGODB_URI);

//Routes

// Get Route for scraping the website
app.get("/scrape", function (req, res){
    axios.get("view-source:https://www.sony.net/SonyInfo/News/Press/").then(function(response){
        var $ = cheerio.load(response.data);

        $(".com_newsrelease-link").each(function (i, element){
            //save an empty result object
            var result = {};
            result.title = $(this)
            .children("a")
            .text();
            result.link = $(this)
            .children("a")
            .attr("href");

            //creating a new Scrape using the result object
            db.Scrape.create(result)
            .then(function(dbScrape){
                console.log(dbScrape);
            })
            .catch(function
                
                (err){
                console.log(err);
            });
        });
        res.send("Scrape Complete");        
       
    });
});
app.get("/scrapes", function(req, res){
    db.Scrape.find({})
    .then(function(dbScrape){
        res.json(dbScrape)
    })
    .catch(function(err){
        res.json(err);
    });
});
app.get("/scrapes/:id", function(req, res){
    db.Scrape.findone({_id:req.params.id})
    .populate("note")
    .then(function(dbScrape){
        res.json(dbScrape);
    })
    .catch(function(err){
        res.json(err)
    });
});

// Route for saving/updating an Scrape's associated Note
app.post("/scrapes/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Scrape with an `_id` equal to `req.params.id`. Update the Scrape to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Scrape.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbScrape) {
        // If we were able to successfully update an Scrape, send it back to the client
        res.json(dbScrape);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  
