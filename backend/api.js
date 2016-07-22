var server = require('./server.js');
var db = require('./db.js');
var stats = require('./stats.js')
var paths = require('./paths.js');
var helpers = require('./helpers.js');
var childProcess = require('child_process');
var guidGenerator = require('guid');
var isGameStarted = false;
var loggedUser = '';
var gameHandler = null;

server.get('/', function (req, res) {
  res.sendFile(paths.indexPath);
});

server.get('/api/GetProfileImages', function (req, res) {
  helpers.readFiles(paths.avatarsPath,
    function (data) {
      for (var index = 0; index < data.length; index++) {
        data[index] = paths.relativeAvatarPath + data[index];
      }
      return res.send(data);
    },
    function (error) {
      throw error;
    });
});

server.get('/api/GetPointerImages', function (req, res) {
  helpers.readFiles(paths.pointersPath,
    function (data) {
      for (var index = 0; index < data.length; index++) {
        data[index] = paths.relativePointersPath + data[index];
      }
      return res.send(data);
    },
    function (error) {
      throw error;
    });
});

server.post('/api/upload', function (req, res) {
  helpers.upload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file.");
    }
    res.end("File is uploaded");
  });
});

server.get('/api/getAllUsers/:name?', function (req, res) {
  if (req.params.name != undefined) {
    res.send(db('users').find({ name: req.params.name }));
  } else {
    res.send(db('users').value());
  }
});

server.post('/api/addUser', function (req, res) {
  db('users').push(req.body)
    .then(post => res.send({ data: db('users').value() }));
});

server.get('/api/isExistingUser/:username', function (req, res) {
  var existingUser = db('users').find({ name: req.params.username });
  if (existingUser) {
    res.send(true);
  } else {
    res.send(false);
  }
});

server.get('/api/deleteUser/:name', function (req, res) {
  db('users').remove({ name: req.params.name });
  res.send(db('users').value());
});

server.get('/api/getUserSettings/:username?', function (req, res) {
  var username = req.params.username;
  if (username) {
    var user = db('users').find({ name: username })
    if (user != undefined) {
      res.send(user.userSettings);
    } else {
      res.status(404);
      res.send({ error: 'Not found' });
    }
  } else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

server.post('/api/saveUserSettings/:username?', function (req, res) {
  var user = db('users').find({ name: req.params.username });
  var userSettings = req.body;
  if (user) {
    db('users')
      .chain()
      .find({ name: req.params.username })
      .assign({ userSettings: userSettings })
      .value();
    res.send(userSettings);
  } else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

server.get('/api/login/:username', function (req, res) {
  loggedUser = req.params.username;
  res.send(true);
});

server.get('/api/logout/', function (req, res) {
  loggedUser = undefined;
  res.send(true);
});

server.get('/api/startGame', function (req, res) {
  var startCommand = req.param('startCommand');
  startCommand = startCommand.replace('{gamesPath}', paths.gamesPath);

  gameHandler = childProcess.exec(startCommand, function (error, stdout, stderr) {
    this.isGameStarted = false;
    gameHandler = null;
  });

  this.isGameStarted = true;
  res.status(200);
  res.send({});
});

server.get('/api/isGameStarted', function (req, res) {
  res.send(!!this.isGameStarted);
});

server.get('/api/terminateGameProcess', function (req, res) {
  if (gameHandler) {
    childProcess.exec('taskkill /PID ' + gameHandler.pid + ' /T /F', function (error, stdout, stderr) {
      res.status(200);
      res.send({});
    });
  } else {
    res.status(200);
    res.send({});
  }
});

server.get('/api/gameStarted/:gameName', function (req, res) {
  var gameName = req.params.gameName;
  var time = new Date().toLocaleString();
  var guid = guidGenerator.create();
  var deviceType = getDeviceTypeForLoggedUser();
  if (guid || loggedUser) {
    stats('sessions').push({
      sessionID: guid.value,
      username: loggedUser,
      gameName: gameName,
      deviceType: deviceType,
      startTime: time,
      endTime: '',
      iterationsPassed: 0,
      invalidClicksCount: 0
    }).then(() => res.send(guid.value));
  }
  else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

server.get('/api/gameUpdate', function (req, res) {
  var guid = req.param('guid');
  var session = stats('sessions').find({ sessionID: guid });
  var misses = req.param('misses');
  if (session) {
    stats('sessions')
      .chain()
      .find({ sessionID: guid })
      .assign({ iterationsPassed: session.iterationsPassed + 1, invalidClicksCount: session.invalidClicksCount + parseInt(misses) })
      .value();
    res.send(true);
  } else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

server.get('/api/gameEnded/:guid', function (req, res) {
  var time = new Date().toLocaleString();
  var guid = req.params.guid;
  var session = stats('sessions').find({ sessionID: guid });
  if (session) {
    stats('sessions')
      .chain()
      .find({ sessionID: guid })
      .assign({ endTime: time })
      .value();
    res.send(true);
  } else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

server.get('/api/getLoggedUserStatistic/', function (req, res) {
  if (loggedUser) {
    res.send(stats('sessions').filter({ username: loggedUser }));
  }
  else {
    res.status(404);
    res.send({ error: 'Not found' });
  }
});

function getDeviceTypeForLoggedUser() {
  var user = db('users').find({ name: loggedUser });
  if (!!user) {
    return user.userSettings.deviceType;
  }
}

server.listen(3000, function () {
  console.log("Working on port 3000");
});
