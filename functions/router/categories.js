var express = require('express');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const { FieldValue } = require('firebase-admin').firestore;

const allRoutes = (db) => {

  const documentExists = async (categoryId) => {
    const check = await db.collection('categories').doc(categoryId).get();
    return check;
  }

  router.get('/categories', function(req, res) {

    db.collection("categories")
    .get()  
    .then(qs => qs.docs.map(doc => Object.assign({id: doc.id}, doc.data())))
    .then(qs => res.send(qs));
  });

  router.get('/categories/:categoryId', function(req, res) {

    documentExists(req.params.categoryId)
    .then( doc => {
      if(doc.exists) {
        db.collection("categories")
          .doc(req.params.categoryId)
          .get()
          .then(qs => res.status(202).send(qs.data()));
      }else{
        res.status(404).send("Category doesn't exist")
      }
    })
  });

  router.post('/categories', 

    body('name').notEmpty().escape().isString(), 
    
    
    (req, res) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
      }
      
      const args = {
        name: req.body["name"],
      };
      db.collection("categories")
        .add(args)
        .then(doc => {
          const docInfo = Object.assign({id: doc.id}, args)
          res.status(201).send(docInfo)
        });
  });

  router.put('/categories/:categoryId', 

  body('name').notEmpty().escape().isString(), 
  
  (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    let args = {name: req.body.name}; //Name only

    documentExists(req.params.categoryId)
    .then( doc => {
      if(doc.exists) {
        db.collection("categories")
          .doc(req.params.categoryId)
          .set(args)
          .then( () => {
              db.collection("categories")
              .doc(req.params.categoryId)
              .get()
              .then(doc => res.status(202).send(Object.assign({id: req.params.categoryId}, doc.data())))
          });
      }else{
        res.status(404).send("Category doesn't exist")
      }
    })    
  });

  router.delete("/categories/:categoryId",

  (req, res) => {
    documentExists(req.params.categoryId)
    .then( doc => {
      if(doc.exists) {
        db.collection("categories")
          .doc(req.params.categoryId)
          .delete()
          .then(() => res.status(202).send("Category has been successfully deleted"))
      }else{
        res.status(404).send("Category doesn't exist")
      }
    })
  });

  return router;
}

module.exports = allRoutes;
