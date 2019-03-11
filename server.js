const graphqlHTTP = require('express-graphql');
const {GraphQLSchema} = require('graphql');
const {makeExecutableSchema} = require('graphql-tools');
const imdb = require('./src/imdb');
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;


const uri = "mongodb+srv://Nathan:Beersheva7@nathan-cluster-lfyvy.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "Denzel";
const DENZEL_IMDB_ID = 'nm0000243';
const port = 9292;

var app = Express();
var database;
var collection;

async function main(){

    try {

       // var movies = await imdb(DENZEL_IMDB_ID);
        MongoClient.connect(uri, { useNewUrlParser: true }, (error, client) => {
                if(error) throw error;
                database = client.db(DATABASE_NAME);
                collection = database.collection("movies");
        });
        
        //definition of our schema like the suggested schema
        const typeDefs = [`
          type Query {
            movies: Int
            random: Movie
            movie(id: String): Movie
            WatchedDateReview(id: String, date: String, review: String): String
            search(limit: Int, metascore: Int): [Movie]

          }
          type Movie {
            link: String
            metascore: Int
            synopsis: String
            title: String
            year: Int
          }
          schema {
            query: Query
          }
        `];

        const resolvers = {
          Query: {
            movies: async () => {
              var movies = await imdb(DENZEL_IMDB_ID);
              const resultat = await collection.insertMany(movies);
              console.log("Inserted succefully ! " + resultat.insertedCount + " documents");
              return resultat.insertedCount;
            },
            random: async () => {
              const resultat = await collection.aggregate([{ $match: { "metascore": {$gt:70}}}, { $sample: { size: 1 }}]).toArray()
              return resultat[0];
          },
             movie: async (root, {id}) => {
              const resultat = await collection.findOne({ "id": id})
              return resultat;
          },
          WatchedDateReview: async (root, {id, date, review}) => {

            const resultat = await collection.updateOne({"id": id}, {$set: {"date":date, "review":review}});
            if(resultat.result.nModified != 0)
            {
              return "Success";
            } 
            else 
            {
              return "Not success";
            }
        },
        /*
        // We can test search with the following GraphQl command
              {
                search (limit:5, metascore:70){
                  link
                  metascore
                synopsis
                  title
                  year}
              }
        */


        search: async (root, {limit, metascore}) => {
            if(limit==undefined)
            {
              limit = 5;
            }
            if(metascore==undefined)
            {
              metascore=0;
            }
            const resultat = await collection.aggregate([{$match:{"metascore": {$gte:Number(metascore)}}}, {$limit:Number(limit)}, {$sort:{"metascore":-1}}]).toArray()
            return resultat
            
        },

        },
      }
        const schema = makeExecutableSchema({
          typeDefs,
          resolvers
        })

        app.use('/graphql', graphqlHTTP({
            schema: schema,
            graphiql: true,
        }));

        app.listen(port, () => {
            console.log("Connected ! ");
            console.log(`Visit http://localhost:${port}/graphql`)
        });

    } catch (e) {
    console.log(e);
  }

}

main();