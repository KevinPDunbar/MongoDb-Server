// Set up
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var cors = require('cors');
 
// Configuration
mongoose.connect('mongodb://localhost/SocialMedia');

//'mongodb://KevinDunbar:woodward1@ds121118.mlab.com:21118/socialmedia'
//'mongodb://localhost/SocialMedia'
 
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());
 
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});
 
// Models
let User = mongoose.model('User', {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    following: Array,
    profilePicture: String,
    aboutMe: String,
});

let Post = mongoose.model('Post', {
    userId: String,
    text: String,
    date: Date,
    score: Number,
    image: String
});

let Comment = mongoose.model('Comment', {
    userId: String,
    postId: String,
    date: Date,
    text: String,
});


 
// Routes


app.post('/api/loginUser', function(req, res) {
 
        console.log("creating user");

        let email = req.body.email;
        let password = req.body.password;

        console.log("PASSED EMAIL: " + req.body.email + "Password : " + password);

         User.find(function(err, users) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            for(let i = 0; i < users.length; i++)
            {
                console.log("Password return" + users[i].password);
                if(email === users[i].email && password === users[i].password)
                {
                    console.log("Login Valid");
                    res.json(users[i]);
                    //break;
                }
                else
                {
                    console.log("Invalid");
                    //res.json(users);
                }

            }
 
        });
 
    });
 
    
    app.get('/api/users', function(req, res) {
 
        console.log("fetching users");
 
        // use mongoose to get all reviews in the database
        User.find(function(err, users) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
 
            res.json(users); // return all reviews in JSON format
        });
    });
 
    
    app.post('/api/createUser', function(req, res) {
 
        console.log("creating user");
 
        // create a review, information comes from request from Ionic
        User.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            profilePicture: "https://firebasestorage.googleapis.com/v0/b/login-2aa53.appspot.com/o/anon_user.gif?alt=media&token=723b0c9d-76a6-40ea-ba67-34e058447c0a",
            done : false
        }, function(err, user) {
            if (err)
                res.send(err);

 
            res.send(JSON.stringify("User Created" + User));
        });
 
    });
 
    // delete a review
    app.delete('/api/users/:user_id', function(req, res) {
        User.remove({
            _id : req.params.user_id
        }, function(err, user) {
 
        });
    });

    app.post('/api/newPost', function(req, res) {
 
        console.log("creating psot");
 
        // create a review, information comes from request from Ionic
        Post.create({
            userId : req.body.userId,
            text : req.body.text,
            date: req.body.date,
            score: req.body.score,
            image: req.body.image,
            done : false
        }, function(err, user) {
            if (err)
                res.send(err);

 
            res.send(JSON.stringify("Post Created" + Post));
        });
 
    });

    //Update Profile Picture
    app.post('/api/updateProfilePicture', function(req, res) {
  let updatedUser = {
    profilePicture: req.body.image,
  };
  User.update({_id: req.body.id}, updatedUser, function(err, raw) {
    if (err) {
      res.send(err);
    }
    res.send(raw);
  });
});

//Update Profile Information
    app.post('/api/updateProfileInformation', function(req, res) {
  let updatedUser = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    aboutMe: req.body.aboutMe
  };
  User.update({_id: req.body.id}, updatedUser, function(err, raw) {
    if (err) {
      res.send(err);
    }
    res.send(raw);
  });
});
 


    //Get User By Id
    app.post('/api/getUserById', function(req, res) {
 
        console.log("fetching user");

        let id = req.body.userId;
        console.log("The passed in User Id: " + id);

         User.findOne({
            _id : id
        }, function(err, user) {
 
            console.log(user);
            res.json(user);
            res.send();
        });
 
    });


    //Get Users Posts By Their Id
    app.post('/api/getUsersPosts', function(req, res) {
 
        console.log("fetching users posts");

        let id = req.body.userId;
        console.log("The passed in User Id: " + id);

         Post.find({
            userId : id
        }, function(err, posts) {
 
            console.log(posts);
            res.json(posts);
            res.send();
        }).sort({date: -1});
 
    });

     //Get the users feed
    app.post('/api/getFollowingById', function(req, res) {
 
        console.log("fetching user");

        let id = req.body.userId;
        console.log("The passed in User Id: " + id);

        let userfollowing;
        let users;

         User.findOne({
            _id : id
        }, function(err, user) {
 
            console.log(user);
            console.log("User Following: " + user.following);
            userfollowing = user.following

            Post.find({
            userId : user.following
        }, function(err, post) {

            //
       
            //
            res.json(post);           
        }).sort({date: -1});

            
        });

           
 
    });
 

    //Get Users By Search
    app.post('/api/SearchUsers', function(req, res) {
 
        console.log("fetching user");

        let query = req.body;
        console.log("The search term is: " + query.term);

         User.find({
            firstName : {$regex : ".*" + query.term + ".*"}
        }, function(err, user) {

            if(user)
            {
                res.json(user);
                res.send();
            }
 
            console.log(user);
            
        });
 
    });

      //Get a post and user by post Id
    app.post('/api/getPostById', function(req, res) {
 
        console.log("fetching post");

        let id = req.body._id;
        console.log("The passed in post Id: " + id);

        let userId;
        let users;

         Post.findOne({
            _id : id
        }, function(err, post) {
 
            res.json(post);
            console.log("post");
            
        });

           
 
    });

          //Get all the comments from a post Id
    app.post('/api/getCommentsById', function(req, res) {
 
        console.log("fetching comments...");

        let id = req.body._id;
        console.log("The passed in post Id: " + id);

       

        console.log("FIND COMMENT WITH: " + id);

         Comment.find({
            postId : id
        }, function(err, comment) {
 
            res.json(comment);
            console.log("PASSED BACK comment " + comment);
            console.log("PASSED BACK comment " + comment.length);
            console.log("PASSED BACK comment " + comment.text);
            console.log("PASSED BACK comment user Id " + comment.userId);
            
        });

           
 
    });

    app.post('/api/newComment', function(req, res) {
 
        console.log("creating comment...");
 
        
        Comment.create({
            userId : req.body.userId,
            postId : req.body.postId,
            text: req.body.text,
            date: req.body.date,
            done : false
        }, function(err, comment) {
            if (err)
                res.send(err);

 
            res.send(JSON.stringify("Comment created" + comment));
        });
 
    });

    
          //Delete post
    app.post('/api/deletePost', function(req, res) {
 
        console.log("deleting post...");

        let id = req.body.postId;
        console.log("The passed in post Id: " + id);

       


         Post.findOneAndRemove({
            _id : id
        }, function(err, comment) {
 
            res.send("comment deleted");
            
            
        });

           
 
    });

    //Unfollow user
    app.post('/api/unfollowUser', function(req, res) {

  let userId = req.body.userId;
  let idToFollow = req.body.idToFollow;

  console.log("MY ID: " + userId);
  console.log("ID to unfollow: " + idToFollow);

	User.update( 
	  {_id: userId}, 
	  { $pull: {following: idToFollow } } 
	)
	.then( err => {
	  res.json(err);
	});
		res.json("unfollowed");
	});

	//Follow user
    app.post('/api/followUser', function(req, res) {

  let userId = req.body.userId;
  let idToFollow = req.body.idToFollow;

  console.log("MY ID: " + userId);
  console.log("ID to follow: " + idToFollow);

	  User
	.update( 
	  {_id: userId}, 
	  { $push: {following: idToFollow } } 
	)
	.then( err => {
	  
	});
		res.json("Followed");
	});

  
// listen (start app with node server.js) ======================================
app.listen(8000);
console.log("App listening on port 8000");