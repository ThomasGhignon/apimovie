var express = require('express');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const { FieldValue } = require('firebase-admin').firestore;

const allRoutes = (db) => {

  const documentExists = async (movieId) => {
    const check = await db.collection('movies').doc(movieId).get();
    return check;
  }

  router.get('/movies', function(req, res) {

    db.collection("movies")
    .get()  
    .then(qs => qs.docs.map(doc => Object.assign({id: doc.id}, doc.data())))
    .then(qs => res.send(qs));
  });
  
  router.get('/movies/:movieId', function(req, res) {

    db.collection("movies")
    .doc(req.params.movieId)
    .get()
    .then(qs => res.send(qs.data()));
  });

  router.post('/movies', 

    body('name').notEmpty().escape().isString(), 
    body('author').notEmpty().escape().isString(), 
    body('img').trim().notEmpty().isURL().escape(), 
    body('video').trim().notEmpty().isURL().escape(), 
    body('category').trim().notEmpty().escape().isString(), 
    body('description').notEmpty().escape().isString(), 
    
    
    (req, res) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
      }
      
      const args = {
        name: req.body["name"],
        author: req.body["author"],
        img: req.body["img"],
        video: req.body["video"],
        category: req.body["category"],
        description: req.body["description"],
        likes: 0,
      };
      db.collection("movies")
        .add(args)
        .then(doc => {
          const docInfo = Object.assign({id: doc.id}, args)
          res.status(201).send(docInfo)
        });
  });


  router.patch('/movies/:movieId', 

  body('name').escape().isString().optional(), 
  body('author').escape().isString().optional(), 
  body('img').trim().isURL().escape().optional(), 
  body('video').trim().isURL().escape().optional(), 
  body('category').trim().escape().isString().optional(), 
  body('description').escape().isString().optional(),
  
  
  (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    let args = {...req.body};

    documentExists(req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .update(args)
          .then( () => {
              db.collection("movies")
              .doc(req.params.movieId)
              .get()
              .then(doc => res.status(202).send(Object.assign({id: req.params.movieId}, doc.data())))
          });
      }else{
        res.status(404).send("Document doesn't exist")
      }
    })    
  });

  router.patch('/movies/like/:movieId', (req, res) => {
    documentExists(req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .update({
            likes: FieldValue.increment(1)
          })
          . then( () => {
            db.collection("movies")
            .doc(req.params.movieId)
            .get()
            .then(doc => res.status(202).send(Object.assign({id: req.params.movieId}, doc.data())))
          });  
      }else{
        res.status(404).send("Document doesn't exist")
      }
    })
  });

  router.delete("/movies/:movieId",

  (req, res) => {
    documentExists(req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .delete()
          .then(() => res.status(202).send("Document has been successfully deleted"))
      }else{
        res.status(404).send("Document doesn't exist")
      }
    })
  });

  return router;
}

module.exports = allRoutes;
