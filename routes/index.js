var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');


//object sended with every response
album_info = {
	album_photo: '#',
	title: '',
	uri: '#',
	resource_url: '#',
	song_info: false,
	empty_area: false,
	video_info: {
		is_video: false,
		video_url: '#',
		fb_link: '#',
		lowest_price: 0
	}
}

//prevent requesting for favicon
router.get('/favicon.ico', function(req, res) {
	res.status(204);
});

// Database connection
var Url = require('../models/url')
mongoose.connect('mongodb://adrian:qwerty@ds125113.mlab.com:25113/express_radio')

//Uploading youtube video to database
router.post('/upload', function(req, res, next) {
	var title = req.body.album_info.title
	var youtube_link = req.body.youtube_link
	//create new database record
	var new_record = new Url({
		title: title,
		video_url: youtube_link
	})
	//save database record
	new_record.save(function(err) {
		if (err) { 
			return res.send({ success: false, msg: 'error writing to database' })
		}
		console.log('ok')
	})


});

// router.post('/albums', function(req, res, next) {
// 	var setup = req.body,
// 	token = 'PrwFREBcgmJxCDHzelVWgSObSBOxvvgtGPXiBFeI',
// 	api_search = 'https://api.discogs.com/database/search?'

// 	request(`${api_search}genre=${setup.genre}&country=${setup.country}&year=${setup.year}&token=${token}`, options , function (error, response, body) {
// 		console.log(response.statusCode)
// 		if (!error && response.statusCode == 200) {

// 			var albums_collection = JSON.parse(response.body)

// 			var how_many_albums = String(albums_collection.pagination.items)
// 			res.send(how_many_albums)
// 		}
// 	})

// });


/* GET home page. */
router.get('/radioo', function(req, res, next) {

	res.render('index',album_info);
});

//api request options
var options = {
	headers: {'user-agent': 'node.js'}
}

//route for requesting data from externall api
router.post('/radioo', function(req, res, next) {
	var setup = req.body,
	token = 'PrwFREBcgmJxCDHzelVWgSObSBOxvvgtGPXiBFeI',
	api_search = 'https://api.discogs.com/database/search?'



	request(`${api_search}genre=${setup.genre}&country=${setup.country}&year=${setup.year}&token=${token}`, options , function (error, response, body) {
		console.log(response.statusCode)
		if (!error && response.statusCode == 200) {
			//grab collection from api
			var albums_collection = JSON.parse(response.body)
			//assigning album data to variables
			var item = Math.floor(Math.random()*albums_collection.results.length);
			var thumb = albums_collection.results.length !== 0 ? albums_collection.results[item].thumb : '/img/nopreview.jpeg'
			var title = albums_collection.results.length !== 0 ? albums_collection.results[item].title : 'This area/decade is empty at this time'
			var uri = albums_collection.results.length !== 0 ? `https://www.discogs.com/${albums_collection.results[item].uri}` : '#'
			var resource_url = albums_collection.results.length !== 0 ? albums_collection.results[item].resource_url : null

			album_info = {
				album_photo: thumb,
				title: title,
				uri: uri,
				resource_url: resource_url,
				song_info: true,
				empty_area: false,
				video_info: {}
			}

			//if there are any matches
			if(album_info.resource_url){
				//make another call for specific album
				request(`${resource_url}`, options , function (error, response, body) {
					if (!error && response.statusCode == 200) {
						//grabing data 
						var random_album_data = JSON.parse(response.body)
						var lowest_price = random_album_data.lowest_price ? `${Math.round(random_album_data.lowest_price)}$` : '$'

						//checking first if there is a video in my database
						Url.findOne({ title: title },function(err, result){
							if(err){
								return res.send({ success: false, msg: 'Error reaading from db', error: err })
							}
							//if there is no video in database assign discogs video
							if(result  || random_album_data.videos){
								var ytb_url = result ? result.video_url : random_album_data.videos[0].uri
								var iframe_url = ytb_url.replace('watch?v=','embed/') + '?autoplay=1';
								var fb_url = `https://www.facebook.com/sharer/sharer.php?u=${ytb_url}`;
								album_info.video_info ={
									is_video: true,
									video_url: iframe_url,
									fb_link: fb_url,
									lowest_price: lowest_price
								}
								return res.send(albums_collection)
							//if there is no video in both ddatabases 
							}else{
								album_info.video_info ={
									is_video: false,
									video_url: '#',
									fb_link: '#',
									lowest_price: lowest_price
								}
								return res.send(album_info)
							}


						})
						
					}
				})
			//if there aren't any matches
			}else{
				album_info = {
					album_photo: thumb,
					title: title,
					uri: uri,
					resource_url: resource_url,
					song_info: true,
					empty_area: true,
					video_info: {
						is_video: false
					}
				}
				
				return res.send(album_info)

			}
		}
	})
});
module.exports = router;

