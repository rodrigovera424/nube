const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const express = require('express');
const session = require("express-session");
const passport = require("passport");
const { Strategy } = require("passport-local");
const LocalStrategy = Strategy;
const exphbs  = require('express-handlebars');
const User  = require('./src/models/User.js');
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Server: HttpServer } = require("http");
const { report } = require("node:process");

const ramdomsRoutes = require('./api/routes/randoms');

const port = process.env.PORT || 8080;
const compression = require("compression");
const winston = require("winston");

mongoose
  .connect("mongodb+srv://test:123456alison@cluster0.piknkma.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("DB is connected"))
  .catch((err) => console.log(err));

const app = express();

const httpServer = new HttpServer(app);

const logger = winston.createLogger({
  level: "warn",
  transports: [
    new winston.transports.Console({ level: "verbose" }),
    new winston.transports.File({ filename: "warn.log", level: "warn" }),    
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

app.use(compression());
app.use(express.json());
app.all('*', checkRoute);
    
function checkRoute(req, res, next) {
  logger.info(`ruta ${req.baseUrl} método ${req._parsedUrl.pathname}`);
  next();
}

//app.use("/static", express.static(__dirname + "/public"));

// ----------- Session - Begin -----------

app.use(
    session({
      secret: "secretSmile",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 10 * 60 * 1000
      }      
    })
);

// ----------- Session - End -------------

// ----------- Template - Begin ----------

app.engine('handlebars', exphbs.engine({ 
    layoutsDir: `${__dirname}/views/layouts`
}))

app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: false }));

// ----------- Template - End ------------

// ----------- Passport - Begin ----------

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if (err) console.log(err);
      if (!user) return done(null, false);
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) console.log(err);
        if (isMatch) return done(null, user);
        return done(null, false);
      });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ----------- Passport - End -----------

// ----------- Routes - Begin -----------

function auth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.render("login-error");
    }
  }
  
  app.get("/", (req, res) => {
    if (req.user) {
      res.redirect("/information");
    } else {
      res.redirect("/login");
    }
  });
  
  app.get("/login", (req, res) => {
    res.render("login");
  });
  
  app.get("/login-error", (req, res) => {
    res.render("login-error");
  });
  
  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "login-error" }),
    (req, res) => {
      res.redirect("/information");
    }
  );
  
  app.get("/register", (req, res) => {
    res.render("register");
  });
  
  app.post("/register", (req, res) => {
    const { username, password, direccion } = req.body;
    User.findOne({ username }, async (err, user) => {
      if (err) console.log(err);
      if (user) res.render("register-error");
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          username,
          password: hashedPassword,
          direccion,
        });
        await newUser.save();
        res.redirect("/login");
      }
    });
  });
  
  app.get("/information", async (req, res) => {
    if (req.user) {
      const datosUsuario = await User.findById(req.user._id).lean();
      res.render("information", {
        datos: datosUsuario,
      });
    } else {
      res.redirect("/login");
    }
  });
  
  app.get("/privada", auth, (req, res) => {
    res.send("Estoy en un ruta privada");
  });
  
  app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.use("/api/randoms", ramdomsRoutes);

app.get("/info", (req, res) => {
  const data = report.getReport();
  const info = {
      numCPUs: numCPUs,    
      so: process.platform,
      pid: process.pid,
      rss: process.memoryUsage.rss(),
      nodejsVersion: data.header.nodejsVersion,
      execPath: process.execPath,
      arg: process.argv,
      port: port,
  };
  //logger.warn("localhost - log warn 2");
  //logger.error("localhost - log error 2");  
  res.send(info);
});

app.get("/datos", (req, res) => {
  console.log(`port: ${port} -> Fyh: ${Date.now()}`);
  res.send(
    `Servidor express <span style="color:blueviolet;">(Nginx)</span> en ${port} - <b>PID ${
      process.pid
    }</b> - ${new Date().toLocaleString()}`
  );
});

app.use(function (req, res) {
  logger.warn(`ruta ${req.baseUrl} método ${req._parsedUrl.pathname}`);
  res.status(404).send(`Cannot GET ${req._parsedUrl.pathname}`);
});

// ----------- Routes - End ------------

httpServer.listen(port, () => {
    console.log(`Servidor http escuchando en el puerto ${port}`);
});
