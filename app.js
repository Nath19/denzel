const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const CONNECTION_URL = "mongodb+srv://Nathan:Beersheva7@nathan-cluster-lfyvy.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "Denzel";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;
app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


//limit - number of movies to return
//metascore - filter by metascore
//$sample to get a random movie
app.get("/movies/search", (request, response) => {
    collection.aggregate([{$match: { metascore: { $gte: Number(request.query.metascore) } }},{ $sample: { size:  Number(request.query.limit) } } ]).toArray((error, result) => {
        if (error) {
          return response.status(500).send(error);
        }
        response.send(result);
      });
  });






//function ok => random movies with metascore greather than 70
app.get("/movies", (request, response) => {
   // db.movie.find({metascore : {$gt: 70}})
  // { $sample: { size: 1 } } random query on mongodb
    collection.aggregate([ {$match : {metascore : {$gt:70} }},{ $sample: { size: 1 } } ] ).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

//populate the database and print the number of movies  
app.get("/movies/populate", async (request, response) => {
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, (err, result) => {
      if (err) {
        return response.status(500).send(err);
      }
      response.send(`total  : ${movies.length}`);
    });
  });



//get the id of our choices
app.get("/movies/:id", (request, response) => {
    collection.findOne({ "id":request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});


//set the date and review
app.post("/movies/:id", (request, response) => {
    collection.updateOne({"id":request.params.id},{$set :{"date":request.body.date,"review":request.body.review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});



