var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');
var async = require('async')

var Url = require('../models/url')

//prevent requesting for favicon
router.get('/favicon.ico', function(req, res) {
	res.status(204);
});

//Uploading youtube video to database
router.post('/upload', function(req, res, next) {
	console.log(req.body)
	var title = req.body.album_info.title
	var year = req.body.setup.year
	var genre = req.body.setup.genre
	var youtube_link =req.body.youtube_link

  //create new database record
  var new_record = new Url({ title: title, video_url: youtube_link, year: year, genre: genre })
  //save database record
  new_record.save(function(err) {
  	if (err) return res.send({ success: false, msg: 'error writing to database' })
  		console.log('ok')
  })
});

/* GET home page. */
router.get('/radioo', function(req, res, next) {

	res.render('index');
});


//route for requesting data from externall api
router.post('/radioo', function(req, res, next) {


	var options = { headers: { 'user-agent': 'node.js' } }
	
	var token = 'PrwFREBcgmJxCDHzelVWgSObSBOxvvgtGPXiBFeI'
	var api_search = 'https://api.discogs.com/database/search?'
	
	if(req.body.soundtrack){
		var query = `${api_search}style=soundtrack&token=${token}`
	}else{
		var setup = req.body
		setup.genre = setup.genre === 'Any' ? '' : setup.genre
		var query = `${api_search}genre=${setup.genre}&country=${setup.country}&year=${setup.year}&token=${token}`
	}
	
	console.log()

	async.waterfall([
		function(callback) {
			request(query, options, function(error, response, body) {
				console.log(response.statusCode)
				if (error || response.statusCode >= 400) return callback(error)
				//grab collection from api
			var albums_collection = JSON.parse(response.body)
			var pagination = albums_collection.pagination
			var pages = pagination.pages > 100 ? 100 : pagination.pages
			var random_page = Math.ceil(Math.random() * pages);
				callback(null,random_page)
			})
		},
		function(random_page,callback) {
			request(`${query}&page=${random_page}`, options, function(error, response, body) {
				console.log(response.statusCode)
				console.log(`${query}&page=${random_page}`)
				if (error || response.statusCode >= 400) return callback(error)

				//grab collection from api
			var albums_collection = JSON.parse(response.body)

				//assigning album data to variables
				var item = Math.floor(Math.random() * albums_collection.results.length);
				var thumb = albums_collection.results.length !== 0 ? albums_collection.results[item].thumb : '/img/nopreview.jpeg'
				var title = albums_collection.results.length !== 0 ? albums_collection.results[item].title : 'This area/decade is empty at this time'
				var uri = albums_collection.results.length !== 0 ? `https://www.discogs.com/${albums_collection.results[item].uri}` : '#'
				var resource_url = albums_collection.results.length !== 0 ? albums_collection.results[item].resource_url : null

				var album_info = {
					album_photo: thumb,
					title: title,
					uri: uri,
					resource_url: resource_url,
					song_info: true,
					empty_area: false,
					video_info: {}
				}
				callback(null,album_info)
			})
		},
		function(album_info, callback) {

			//if there are any matches
			if (album_info.resource_url) {
				//make another call for specific album
				request(`${album_info.resource_url}`, options, function(error, response, body) {
					//grabing data
					var random_album_data = JSON.parse(response.body)
					var lowest_price = random_album_data.lowest_price ? `${Math.round(random_album_data.lowest_price)}$` : '$'

					//checking first if there is a video in my database
					Url.findOne({ title: album_info.title }, function(err, result) {
						if (err) callback(err)

						//if there is no video in database assign discogs video
					if (result || random_album_data.videos) {

						if(result){
							var ytb_url = result.video_url ? result.video_url : random_album_data.videos[0].uri
							var likes = result.likes ? result.likes.length : 0
							var comments = result.comments ? result.comments : null
						}else{
							var ytb_url = random_album_data.videos[0].uri
							var likes = 0
							var comments = null
						}
						var iframe_url = ytb_url.replace('watch?v=', 'embed/') + '?autoplay=1';
						var fb_url = `https://www.facebook.com/sharer/sharer.php?u=${ytb_url}`;
						album_info.video_info = {
							is_video: true,
							video_url: iframe_url,
							fb_link: fb_url,
							lowest_price: lowest_price,
							likes: likes,
							comments: comments
						}

						return callback(null, album_info)
							//if there is no video in both ddatabases
						}else{
							album_info.video_info = {
								is_video: false,
								video_url: '#',
								fb_link: '#',
								lowest_price: lowest_price,
								likes: 0,
								comments: null
							}

							return callback(null, album_info)
						}
					})
				})
			}
			//if there aren't any matches
			else {
				album_info.video_info = {
					is_video: false,
					video_url: '#',
					fb_link: '#',
					lowest_price: '',
					likes: 0
				}

				return callback(null,album_info)
			}
		}
		], function(err, album_info) {
			if (err) return res.send({ error: err, msg: 'There was an error' })

		// res.render('index', { album_info })

		// This works totalty fine but res.render('index', { album_info }) Doesn't do anything
		res.send(album_info)	
		
	})
});
//like button
router.post('/like',ensureAuthenticated, function(req, res, next) {
	var title = req.body.title
	var is_video = JSON.parse(req.body.video_info.is_video)
	

if(is_video){
	var email = req.user.email
		Url.findOne({ title: title }, function(err, result) {
			if (result) {
				var index = result.likes.indexOf(email);
				if(index !== -1){
					result.likes.splice(index, 1)
				}else{
					result.likes.push(email)
				}
				result.likes
				var likes = result.likes
				Url.update({title: title},{"$set": {likes: likes}},function(err,res){

				})

					return	res.send({likes: likes.length})

			} else {
				
				var likes = [];
				likes.push(email)
				var new_record = new Url({ title, video_url: '', likes: likes })
  				//save database record
  				new_record.save(function(err) {
  					if (err) {
  						return res.send({ success: false, msg: 'error writing to database' })
  				}else{
  					console.log('ok')
  					return res.send({likes: likes.length})
  				}
  						
  				})
  				
  			}
  		});
	}
});

//like button
router.post('/comment',ensureAuthenticated, function(req, res, next) {
	var user_comment = req.body.comment
	var username = req.user.username
	var title = req.body.album_info.title
	console.log(username, user_comment,title)


if(true){

		Url.findOne({ title: title }, function(err, result) {
			if (result) {
				var comments = result.comments;

					comments.push({user_comment: user_comment, username: username})
		
				Url.update({title: title},{"$set": {comments: comments}},function(err,res){

				})

					return	res.send({comments: comments})

			} else {
				
				var comments = [];
				comments.push({user_comment: user_comment, username: username})
				var new_record = new Url({ title, video_url: '', comments: comments })
  				//save database record
  				new_record.save(function(err) {
  					if (err) {
  						return res.send({ success: false, msg: 'error writing to database' })
  				}else{
  					console.log('ok')
  					return res.send({comments: comments})
  				}
  						
  				})
  				
  			}
  		});
 	}
});


function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		
		return next();
	} else {
		res.send({info: true})
	}
}

module.exports = router;
