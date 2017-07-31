$( document ).ready(function() {

	//setup for for year and genre stored in local storage
	var setup = JSON.parse(localStorage.getItem("setup", setup)) || {year: 1969, genre: 'Soul'};




	var slider = $('input.time'),
	help = $('.help'),
	flag = $('.flag'),
	add = $('.add i')

	//
	slider.val(setup.year)
	$('#year').text(setup.year)

	$('.mood li p').each( function(index,element) {
		$(this).removeClass('clicked')
		if($(this).text() == setup.genre){
			$(this).siblings().addClass('clicked')
		}
		
	});



	slider.on('change mousemove', function(){
		setup.year = slider.val()
		localStorage.setItem("setup", JSON.stringify({year: setup.year, genre: setup.genre}))
		$('#year').text(setup.year)

	})
	//event handling for help tooltip
	
	help.on('click', function(){
		$('.start').toggleClass('hidden')
	})
	//event handling for moods tab 
	flag.on('click', function(){
		$('.mood').toggleClass('hide')
	})
	$('.mood li').on('click', function(){
		$('.mood i').removeClass('clicked')
		$(this).find('i').addClass('clicked')
		setup.genre = $(this).text()
		localStorage.setItem("setup", JSON.stringify({year: setup.year, genre: setup.genre}))
	})
	//event handling for adding video
	add.on('click', function(){
		$('.post-song').toggleClass('hidden')
	})

	//sending request the server for putting link to the database
	$('form').on('submit', function(e){
		var youtube_link = $('input[type=text]').val()
		db_query = {
			youtube_link: youtube_link,
			album_info: JSON.parse(localStorage.getItem("album_info"))
		}

		e.preventDefault()
		$.ajax({
			type: 'POST',
			url: '/upload',
			data: db_query,
			dataType: 'json',
			success: function(data){

				console.log(data)
				//console.log(JSON.parse(localStorage.getItem("setup", setup)))

			}
		});
	})

	//load map and handle click event on region
	jQuery('#vmap').vectorMap({
		map: 'world_en',
		selectedColor: '#ffcccc',
		color: '#fdfcc4',
		enableZoom: true,
		showTooltip: true,
		onRegionClick : function (element, code, region){
			//Grab the info about the country
			var country = region.replace(' ','_')
			setup.country = country
			//Making request to discogs api
			$.ajax({
				type: 'POST',
				url: '/radioo',
				data: setup,
				dataType: 'json',
				success: function(data){
					$('.song-info').remove()
					
		 var html = ejs.render( `<div class="song-info <%if (!album_info.song_info) { %> hidden <% } %>">
									<div class="box-title">Now Playing</div>
									<div class="song-thumbnail">
										<img src='<%= album_info.album_photo %>' height='150' width='150' alt="" class="thumb">
									</div>
									<p class="artist"><%= album_info.title %></p>
									<div class="media-container <%if (album_info.empty_area) { %> hidden <% } %>">
										<a href='<%= album_info.uri %>' target="_blank" class="link ">check info about the album</a>
										<p id="no-video"><%if (!album_info.video_info.is_video) { %>the video is not provided<% } %></p>
										<div class="buttons-container ">    
											<a class="fb-share flex" href="<%if (!album_info.video_info.fb_url) { %> disabled <% } %>" target="_blank">
												<img src="/img/facebook.png" alt="">
											</a>
											<div class="price-wrapper flex">
												<div class="coin">
													<p class="price"><%if (album_info.video_info.lowest_price !== 0) { %> <%= album_info.video_info.lowest_price %> <% }else{ %> $ <% } %></p>
												</div>
											</div>
											<div class="add flex <%if (album_info.video_info.is_video) { %> disabled <% } %>"><i class="fa fa-plus-square" aria-hidden="true"></i></div>
											<div class="like flex"><i class="fa fa-heart" aria-hidden="false"><p class="likes"><%= album_info.video_info.likes %></p></i></div>
										</div>
									</div>
									<div class="player-wrapper <%if (!album_info.video_info.is_video ) { %> hidden <% } %> ">
										<iframe src="<%= album_info.video_info.video_url %>" frameborder="0" class="player"></iframe>
										<img id="vinyl" height="100px" src="/img/vinyl.svg" alt="">
									</div>
								</div>`,{album_info: data})
					$('.song-info-wrapper').append(html)

					localStorage.setItem("album_info", JSON.stringify(data));

				}
			});
		}

	});
	$('.song-info-wrapper').on('click','.like', function(e){
		var album_info = JSON.parse(localStorage.getItem("album_info"))
		$.ajax({
			type: 'POST',
			url: '/like',
			data: album_info,
			dataType: 'json',
			success: function(data){
				$('.likes').remove()
				var likes = ejs.render('<p class="likes"><%= likes %></p>', {likes: data.likes})
				$('.fa-heart').append(likes)
				
			}
		});
	})

});