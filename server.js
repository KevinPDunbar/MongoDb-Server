// Set up
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var cors = require('cors');



var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

// Configuration
mongoose.connect('mongodb://localhost/SocialMedia');

var conn = mongoose.connection;
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);


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

/** Setting up storage using multer-gridfs-storage */
var storage = GridFsStorage({
  gfs : gfs,
  filename: function (req, file, cb) {
    var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
  },
  /** With gridfs we can store aditional meta-data along with the file */
  metadata: function(req, file, cb) {
    cb(null, { originalname: file.originalname });
  },
  root: 'ctFiles' //root name for collection to store files into
});

var upload = multer({ //multer settings for single upload
  storage: storage
}).single('file');

/** API path that will upload the files */
app.post('/api/upload', function(req, res) {
  upload(req,res,function(err){
    if(err){
      res.json({error_code:1,err_desc:err});
      return;
    }
    res.json({error_code:0,err_desc:null});
  });
});

app.get('/file/:filename', function(req, res){
        gfs.collection('ctFiles'); //set collection name to lookup into

        /** First check if file exists */
        gfs.files.find({filename: req.params.filename}).toArray(function(err, files){
            if(!files || files.length === 0){
                return res.status(404).json({
                    responseCode: 1,
                    responseMessage: "error"
                });
            }
            /** create read stream */
            var readstream = gfs.createReadStream({
                filename: files[0].filename,
                root: "ctFiles"
            });
            /** set the proper content type */
            res.set('Content-Type', files[0].contentType)
            /** return response */
            return readstream.pipe(res);
        });
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
    image: String,
    video: Object,
});

let Comment = mongoose.model('Comment', {
    userId: String,
    postId: String,
    date: Date,
    text: String,
});

let Like = mongoose.model('Like', {
    userId: String,
    postId: String,
});

let Notification = mongoose.model('Notification', {
    commentOwnerId: String,
    date: Date,
    postId: String,
    pusherId: String,
    read: Boolean,
    recieveId: String,
    subject: String
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

             	//
             	bcrypt.compare(password, users[i].password, function(err, isMatch) {
	                
	                console.log('Is password match :', isMatch);

	                if (isMatch && email === users[i].email) {
	                	console.log("User and Password Match, send user back");
	                    res.json(users[i]);
	                } else {
	                    console.log("Invalid Login")
	                }
            	});
             

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
        }).select("-password");
    });
 
    
    app.post('/api/createUser', function(req, res) {
 
        console.log("creating user");

        let userPassword = req.body.password;
        let newPassword;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let email = req.body.email;
        let profilePicture = "https://firebasestorage.googleapis.com/v0/b/login-2aa53.appspot.com/o/anon_user.gif?alt=media&token=723b0c9d-76a6-40ea-ba67-34e058447c0a";

        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
	        if (err) return next(err);

	        // hash the password along with our new salt
	        bcrypt.hash(userPassword, salt, function(err, hash) {
	            if (err) return next(err);

	            // override the cleartext password with the hashed one
	            newPassword = hash;
	            //
	             User.create({
		            firstName : firstName,
		            lastName : lastName,
		            email: email,
		            password: newPassword,
		            profilePicture: profilePicture,
		            done : false
		        }, function(err, user) {
		            if (err)
		                res.send(err);

		 
		            res.send(JSON.stringify("User Created" + User));
		        });
	            //
	        });
	    });
        //
 
        // create a review, information comes from request from Ionic
       /* User.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email: req.body.email,
            password: newPassword,
            profilePicture: "https://firebasestorage.googleapis.com/v0/b/login-2aa53.appspot.com/o/anon_user.gif?alt=media&token=723b0c9d-76a6-40ea-ba67-34e058447c0a",
            done : false
        }, function(err, user) {
            if (err)
                res.send(err);

 
            res.send(JSON.stringify("User Created" + User));
        }); */
 
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

 
            //res.send(JSON.stringify("Post Created" + Post));
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
 
        //console.log("fetching user");

        let id = req.body.userId;
       // console.log("The passed in User Id: " + id);

         User.findOne({
            _id : id
        }, function(err, user) {
 
           // console.log(user);
            res.json(user);
            res.send();
        }).select("-password");
 
    });


    //Get Users Posts By Their Id
    app.post('/api/getUsersPosts', function(req, res) {
 
       // console.log("fetching users posts");

        let id = req.body.userId;
       // console.log("The passed in User Id: " + id);

         Post.find({
            userId : id
        }, function(err, posts) {
 
            //console.log(posts);
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
 
           // console.log(user);
           // console.log("User Following: " + user.following);
            userfollowing = user.following

            Post.find({
            userId : user.following
        }, function(err, post) {

            //
       
            //
            res.json(post);           
        }).sort({date: -1});

            
        }).select("-password");

           
 
    });
 

    //Get Users By Search
    app.post('/api/SearchUsers', function(req, res) {
 
        //console.log("fetching user");

        let query = req.body;
       // console.log("The search term is: " + query.term);

         User.find({
            firstName : {$regex : ".*" + query.term + ".*"}
        }, function(err, user) {

            if(user)
            {
                res.json(user);
                res.send();
            }
 
            //console.log(user);
            
        }).select("-password").sort({firstName: 'asc'});
 
    });

      //Get a post and user by post Id
    app.post('/api/getPostById', function(req, res) {
 
        //console.log("fetching post");

        let id = req.body._id;
       // console.log("The passed in post Id: " + id);

        let userId;
        let users;

         Post.findOne({
            _id : id
        }, function(err, post) {
 
            res.json(post);
            //console.log("post");
            
        });

           
 
    });

          //Get all the comments from a post Id
    app.post('/api/getCommentsById', function(req, res) {
 
        //console.log("fetching comments...");

        let id = req.body._id;
        //console.log("The passed in post Id: " + id);

       

        console.log("FIND COMMENT WITH: " + id);

         Comment.find({
            postId : id
        }, function(err, comment) {
 
            res.json(comment);
            //console.log("PASSED BACK comment " + comment);
            //console.log("PASSED BACK comment " + comment.length);
            //console.log("PASSED BACK comment " + comment.text);
            //console.log("PASSED BACK comment user Id " + comment.userId);
            
        });

           
 
    });

    app.post('/api/newComment', function(req, res) {
 
        //console.log("creating comment...");
 
        
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
        //console.log("The passed in post Id: " + id);

       


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

  //console.log("MY ID: " + userId);
  //console.log("ID to unfollow: " + idToFollow);

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

  //console.log("MY ID: " + userId);
  //console.log("ID to follow: " + idToFollow);

	  User
	.update( 
	  {_id: userId}, 
	  { $push: {following: idToFollow } } 
	)
	.then( err => {
	  
	});
		res.json("Followed");
	});

    app.post('/api/getUnreadCount', function(req, res) {
 
        console.log("fetching notifications...");

        let id = req.body.userId;

         Notification.find({
            recieveId : id,
            read: false
        }, function(err, notification) {
 
            res.json(notification);
                  
        });

    });

    app.post('/api/getAllNotifications', function(req, res) {
 
        console.log("fetching notifications...");

        let id = req.body.userId;

         Notification.find({
            recieveId : id
        }, function(err, notification) {
 
            res.json(notification);
                  
        }).sort({date: -1});

    });

    app.post('/api/newNotification', function(req, res) {
 
        console.log("creating notification...");
 
        
        Notification.create({
            commentOwnerId: req.body.commentOwnerId,
   			date: req.body.date,
		    postId: req.body.postId,
		    pusherId: req.body.pusherId,
		    read: req.body.read,
		    recieveId: req.body.recieveId,
		    subject: req.body.subject,
            done : false
        }, function(err, notification) {
            if (err)
                res.send(err);

 
            res.send(JSON.stringify("Notification created" + notification));
        });
 
    });

    //Update Profile Information
    app.post('/api/setNotificationAsRead', function(req, res) {
  let updatedNotification = {
       read: true
  };
  Notification.update({_id: req.body._id}, updatedNotification, function(err, raw) {
    if (err) {
      res.send(err);
    }
    res.send(raw);
  });
});

        //Get all the likes from a post Id
    app.post('/api/getLikesById', function(req, res) {
 
        let id = req.body._id;
        
        console.log("FIND Likes WITH: " + id);

         Like.find({
            postId : id
        }, function(err, like) {
 
            res.json(like);
            
        });      
 
    });

app.post('/api/likePost', function(req, res) {


Like.create({
    userId : req.body.userId,
    postId : req.body.postId,
    done : false
}, function(err, like) {
    if (err)
        res.send(err);

    Post.findOne({
        _id : req.body.postId
    }, function(err, post) {

        console.log("score is: " + post.score);
        let score = post.score;
        score++;
         let updatedPost = {
		       score: score
		  };

		  Post.update({_id: req.body.postId}, updatedPost, function(err, raw) {
	    if (err) {
	      
	    }
	    
	  });


        
    });
      

    res.send(JSON.stringify("Like created" + like));
});

});

app.post('/api/unlikePost', function(req, res) {


Like.findOneAndRemove({
    postId : req.body.postId,
    userId : req.body.userId
}, function(err, like) {
    if (err)
        res.send(err);

    Post.findOne({
        _id : req.body.postId
    }, function(err, post) {

        console.log("score is: " + post.score);
        let score = post.score;
        score--;
         let updatedPost = {
		       score: score
		  };

		  Post.update({_id: req.body.postId}, updatedPost, function(err, raw) {
	    if (err) {
	      
	    }
	    
	  });


        
    });
      

    res.send(JSON.stringify("Like created" + like));
});

});
 

    

  
// listen (start app with node server.js) ======================================
app.listen(8000);
console.log("App listening on port 8000");