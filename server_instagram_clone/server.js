var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var multiparty = require('connect-multiparty');
var objectId = require('mongodb').ObjectId;

var fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());


app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'content-type'); // If needed
    res.setHeader('Access-Control-Allow-Credentials', true); // If needed



    next();
})

var port = 8080;

app.listen(port);

// Retrieve
var MongoClient = require('mongodb').MongoClient;

console.log("Servidor HTTP escutando na Porta ", port);


app.post('/api', function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
    //res.setHeader('Access-Control-Allow-Credentials', true); // If needed

    var times_stamp = new Date().getTime();

    var url_imagem = times_stamp + "_" + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }

        // Connect to the db

        MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {

            var collection = db.collection('postagens');
            collection.insert(dados, function (err, result) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(result);
                }
                db.close();
            });
        });

    });

});

app.get('/api', function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
    //res.setHeader('Access-Control-Allow-Credentials', true); // If needed

    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {

        var collection = db.collection('postagens');
        collection.find().toArray(function (err, result) {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
            db.close();
        });
    });

});

app.get('/api/:id', function (req, res) {

    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {

        var collection = db.collection('postagens');
        collection.find(objectId(req.params.id)).toArray(function (err, result) {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
            db.close();
        });
    });

});

app.put('/api/:id', function (req, res) {

    // Connect to the db

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {

        var collection = db.collection('postagens');
        collection.update(
            { _id: objectId(req.params.id) },
            {
                $push: {
                    comentarios: {
                        id_comentario: new objectId(),
                        comentario: req.body.comentario
                    }
                }
            },
            {},
            function (err, records) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(records);
                }

                db.close();
            }
        );

    });

});

app.delete('/api/:id', function (req, res) {


    // Connect to the db 

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {

        var collection = db.collection('postagens');
        collection.update(
            {},
            {
                $pull: {
                    comentarios: { id_comentario: objectId(req.params.id) }
                }
            },
            { multi: true },
            function (err, records) {

                if (err) {
                    res.json(err);
                } else {
                    res.json(records);
                }

                db.close();
            }
        );

    });

});

app.get('/imagens/:imagem', function (req, res) {

    var img = req.params.imagem;
    fs.readFile('./uploads/' + img, function (err, content) {
        if (err) {
            res.status(400).json(err);
            return;
        }
        res.writeHead(200, { 'Content-Type': 'image/jpg' });
        res.end(content);
    });
});