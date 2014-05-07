var http = require('http');
var fs = require('fs-extra');
var formidable = require('formidable');
var sys = require('sys');
var gm = require('gm').subClass({ imageMagick: true});
var express = require("express");
var jade = require("jade");
var less = require("less");
var locale = require("locale");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var app = express();
app.use(cookieParser());
app.use(session({secret: 'keyboard cat', key: 'sid', cookie: { secure: true, httpOnly: true }}))

var usernumber = 0;

app.set('views', __dirname + '/usr');
app.set('view engine','jade');
app.set('view options', {layout: true});

/*
fs.readdir( '/resimg', function( err, files ) {
    if ( err ) return console.log( err );
    files.forEach(function( file ) {
        var filePath = '/resimg/' + file;
        fs.stat( filePath, function( err, stat ) {
            if ( err ) return console.log( err );
            var livesUntil = new Date();
            livesUntil.setHours(livesUntil.getHours() - 1);
            if ( stat.ctime < livesUntil ) {
                fs.unlink( filePath, function( err ) {
                    if ( err ) return console.log( err );
                });
            }
        });
    });
});
*/

app.get('/', function(req, res) {
  var acptLang = req.headers["accept-language"].toLowerCase();
  console.log(acptLang);
  if( acptLang.indexOf("ko") != null ) {
      res.render('index_ko.jade');
  } else {
    res.render('index_en.jade');
  }
});

app.get('/pika', function(req, res) {
  res.sendfile(__dirname + '/usr/img/pika.png');
});
app.get('/pika2', function(req, res) {
  res.sendfile(__dirname + '/usr/img/pika2.jpeg');
});
app.get('/syh', function(req, res) {
  res.sendfile(__dirname + '/usr/img/syh.jpg');
});

app.get('/style', function(req, res) {
  fs.readFile(__dirname + '/usr/style.less', function(err,styles) {
    if(err) return console.error('Could not open file: %s',err);
    less.render(styles.toString(), function(er,css) {
        if(er) return console.error(er);
        fs.writeFile(__dirname + '/usr/style.css', css, function(e) {
            if(e) return console.error(e);
            console.log('Compiled CSS');
        });
    });
  });
  res.sendfile(__dirname + '/usr/style.css');
});

app.get('/result', function(req, res) {
  var acptLang = req.headers["accept-language"].toLowerCase();
  console.log(acptLang);
  if( acptLang.indexOf("ko") != null ) {
      res.render('result_ko.jade');
  } else {
    res.render('result_en.jade');
  }
});

app.get('/download', function(req, res) {
  res.download('resimg/' + req.cookies.usrnum + '/pikapika.jpg', function(err) {
    if(err) {
      var acptLang = req.headers["accept-language"].toLowerCase();
      console.log(acptLang);
      if( acptLang.indexOf("ko") != null ) {
        res.render('error_ko.jade', {msg: 1});
      }
      else res.render('error_en.jade', {msg: 1});
    }
    fs.remove('resimg/' + req.cookies.usrnum, function(err) {
      if(err) console.log("File Removal Error : " + err);
      else console.log("File Removal : " + req.cookies.usrnum);
    });
  });
});

app.get('/image', function(req, res) {
  console.log("req cookie num : "+ req.cookies.usrnum);
  res.sendfile('resimg/' + req.cookies.usrnum + '/pikapika.jpg', function(err) {
    if (err) console.log(err);
  });
});

app.post('/upload', function(req, res) {
  usernumber++;


  res.cookie('usrnum', usernumber);

  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
  })
  .on('end', function() {

    var temp_path = this.openedFiles[0].path;
    var file_name = this.openedFiles[0].name;
    var new_location = __dirname + '/resimg/' + usernumber + "/";
    var inputFile = gm(new_location + file_name);
    var outputFile = gm(new_location + "pikapika.jpg");

    var args1 = [
      'convert', '-fill', 'white', '-colorize', '95,95,95'
    ];
    var args2 = [
      'composite', '-gravity', 'center',
      __dirname + "/lines.png",
      new_location + "/pikapika.jpg"
    ];

    fs.copy(temp_path, new_location + file_name, function(err) {
      // image processing with GraphicsMagick
      if(err) console.log(err);
      inputFile.size(function (err, size) {
        if(err) console.log(err);
        if(size.width <= 2000 && size.height <= 2000) {
            inputFile = inputFile.fill('white')
            .colorize(95,95,95)
            .write(new_location + "pikapika.jpg", function(err) {
                // image processing 2
                outputFile.command(args2)
                .write(new_location + "pikapika.jpg", function(err) {
                  if(err) console.log(err);
                  res.redirect('/result');
                  console.log("Image Processing Success " + usernumber);
                }); //write 2
            }); //write 1
        } else {
          var acptLang = req.headers["accept-language"].toLowerCase();
          console.log(acptLang);
          if( acptLang.indexOf("ko") != null ) {
            res.render("error_ko.jade", {msg: 2});
          } else {
            res.render('error_en.jade', {msg: 2});
          }
        } //size restrict
      }); //size check
    }); //fs.copy
  }); //form.on
  setTimeout( function() {
    fs.exists("resimg/" + usernumber, function(exists) {
      if (exists) {
        fs.remove("resimg/" + usernumber, function(err) {
          if(err) console.log("File Auto Removal error: " + err);
          else console.log("File Auto Removal : " + usernumber);
        });
      }
    }); //fs.exists
  }, 60000, usernumber);
}); //post

app.listen(process.env.PORT || 5000)
console.log("Open Success");
