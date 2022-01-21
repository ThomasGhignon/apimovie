var express = require('express');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const { FieldValue } = require('firebase-admin').firestore;

const allRoutes = (db) => {

  const documentExists = async (collection, id) => {
    const check = await db.collection(collection).doc(id).get();
    return check;
  }

  router.get('/movies', function(req, res) {

    db.collection("movies")
    .get()  
    .then(qs => qs.docs.map(doc => Object.assign({id: doc.id, imgDecodeURI: decodeURIComponent(doc.data().img), videoDecodeURI: decodeURIComponent(doc.data().video)}, doc.data())))
    .then(qs => res.send(qs));
  });
  
  router.get('/movies/:movieId', function(req, res) {

    documentExists("movies", req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .get()
          .then(qs => res.status(202).send(Object.assign({imgDecodeURI: decodeURIComponent(qs.data().img), videoDecodeURI: decodeURIComponent(qs.data().video)},qs.data())));
      }else{
        res.status(404).send("Movie doesn't exist")
      }
    })
  });

  router.post('/movies', 

    body('name').notEmpty().escape().isString(), 
    body('author').notEmpty().escape().isString(), 
    body('img').trim().notEmpty().isURL(), 
    body('video').trim().notEmpty().isURL(), 
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
        img: encodeURIComponent(req.body['img']),
        video: encodeURIComponent(req.body['video']),
        category: req.body["category"],
        description: req.body["description"],
        likes: 0,
      };

      documentExists("categories", req.body["category"])
      .then( doc => {
        if(doc.exists) {
          db.collection("movies")
            .add(args)
            .then(doc => {
              const docInfo = Object.assign({id: doc.id, imgDecodeURI: decodeURIComponent(args.img), videoDecodeURI: decodeURIComponent(args.video)}, args)
              res.status(201).send(docInfo)
            });
        }else{
          res.status(404).send("Category doesn't exist")
        }
      }) 
  });


  router.patch('/movies/:movieId', 

  body('name').escape().isString().optional(), 
  body('author').escape().isString().optional(), 
  body('img').trim().isURL().optional(), 
  body('video').trim().isURL().optional(), 
  body('category').trim().escape().isString().optional(), 
  body('description').escape().isString().optional(),  
  
  (req, res) => {
    if(req.body['img']){
      req.body['img'] = encodeURIComponent(req.body['img']); 
    } 
    if(req.body['video']){
      req.body['video'] = encodeURIComponent(req.body['video']); 
    } 

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    let args = {...req.body};

    documentExists("movies", req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .update(args)
          .then( () => {
              db.collection("movies")
              .doc(req.params.movieId)
              .get()
              .then(doc => res.status(202).send(Object.assign({id: req.params.movieId, imgDecodeURI: decodeURIComponent(doc.data().img), videoDecodeURI: decodeURIComponent(doc.data().video)}, doc.data())))
          });
      }else{
        res.status(404).send("Movie doesn't exist")
      }
    })    
  });

  router.patch('/movies/like/:movieId', (req, res) => {
    documentExists("movies", req.params.movieId)
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
            .then(doc => res.status(202).send(Object.assign({id: req.params.movieId, imgDecodeURI: decodeURIComponent(doc.data().img), videoDecodeURI: decodeURIComponent(doc.data().video)}, doc.data())))
          });  
      }else{
        res.status(404).send("Movie doesn't exist")
      }
    })
  });

  router.delete("/movies/:movieId", (req, res) => {
    documentExists("movies", req.params.movieId)
    .then( doc => {
      if(doc.exists) {
        db.collection("movies")
          .doc(req.params.movieId)
          .delete()
          .then(() => res.status(202).send("Movie has been successfully deleted"))
      }else{
        res.status(404).send("Movie doesn't exist")
      }
    })
  });

  return router;
}

module.exports = allRoutes;
