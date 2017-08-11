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
	const { album_info: { title }, youtube_link } = req.body
  //create new database record
  var new_record = new Url({ title, video_url: youtube_link })
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
	//api request options
	var options = { headers: { 'user-agent': 'node.js' } }
	var setup = req.body,
	token = 'PrwFREBcgmJxCDHzelVWgSObSBOxvvgtGPXiBFeI',
	api_search = 'https://api.discogs.com/database/search?'
	setup.genre = setup.genre === 'Any' ? '' : setup.genre

	async.waterfall([
		function(callback) {
			request(`${api_search}genre=${setup.genre}&country=${setup.country}&year=${setup.year}&token=${token}`, options, function(error, response, body) {
				console.log(response.statusCode)
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
						}else{
							var ytb_url = random_album_data.videos[0].uri
							var likes = 0
						}
						var iframe_url = ytb_url.replace('watch?v=', 'embed/') + '?autoplay=1';
						var fb_url = `https://www.facebook.com/sharer/sharer.php?u=${ytb_url}`;
						album_info.video_info = {
							is_video: true,
							video_url: iframe_url,
							fb_link: fb_url,
							lowest_price: lowest_price,
							likes: likes
						}

						return callback(null, album_info)
							//if there is no video in both ddatabases
						}else{
							album_info.video_info = {
								is_video: false,
								video_url: '#',
								fb_link: '#',
								lowest_price: lowest_price,
								likes: 0
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

router.post('/like',ensureAuthenticated, function(req, res, next) {
	var title = req.body.title
	var is_video = JSON.parse(req.body.video_info.is_video)
	

if(is_video){
	var email = req.user.email
		Url.findOne({ title: title }, function(err, result) {
			if (result) {
				console.log(result.likes)
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


function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		
		return next();
	} else {
		res.send({info: true})
	}
}

module.exports = router;
