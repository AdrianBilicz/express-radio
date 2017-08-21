$( document ).ready(function() {

	//setup for for year and genre stored in local storage
	

	var songInfoBox = {
		setup: JSON.parse(localStorage.getItem("setup")) || {year: 1969, genre: 'Soul'},
		self: false,
		refreshComment: null,
		street_view: false,
		panorama: {},
		songBoxTemplate: 
		`<div class="song-info <%if (!album_info.song_info) { %> hidden <% } %>">
			<div class="box-title">Now Playing</div>
			<div class="song-thumbnail">
				<img src='<%= album_info.album_photo %>' height='150' width='150' alt="" class="thumb">
			</div>
			<p class="artist"><%= album_info.title %></p>
			<div class="media-container <%if (album_info.empty_area) { %> hidden <% } %>">
				<a href='<%= album_info.uri %>' target="_blank" class="link ">check info about the album</a>
				<p id="no-video"><%if (!album_info.video_info.is_video) { %>the video is not provided<% } %></p>
				<div class="buttons-container ">    
					<a class="fb-share flex" href="<%if (album_info.video_info.is_video) { %> <%= album_info.video_info.fb_link %> <% } %>" target="_blank">
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

			<div class="comment-section">
				<textarea name="" id="comment" rows="3"></textarea>
				<input type="submit" class="submit-comment" value="Comment">
			</div>


			<div class="player-wrapper <%if (!album_info.video_info.is_video ) { %> hidden <% } %> ">
				<iframe src="<%= album_info.video_info.video_url %>" frameborder="0" class="player"></iframe>

			<%if (album_info.video_info.comments ) { 
				
				%> 
				<div class="users_comments">
					<div class="box-title">Comments</div>
					<p class="user_comment">

						<blockqoute><%= album_info.video_info.comments[0].user_comment %></blockqoute>
						<span>-<%= album_info.video_info.comments[0].username %>-</span>
					</p>
				</div>
			<% } %>

				<img id="vinyl" height="150px" src="/img/vinyl.svg" alt="">
			</div>
		</div>`,
		likesTemplate: '<p class="likes"><%= likes %></p>',
		commentTemplate: '<p class="user_comment"><blockqoute><%= comments.user_comment %></blockqoute><span>-<%= comments.username %>-</span></p>',
		init: function(){
			self = this
			this.cacheDom();
			this.loadMap();
			this.$genre.each(this.pickupGenre)
			this.bindEvents();
			this.render();
			
		},
		cacheDom: function(){
			this.$slider = $('input.time');
			this.$help = $('.help');
			this.$flag = $('.flag');
			this.$songInfoWrapper = $('.song-info-wrapper');
			this.$close_btn = $('.close-btn');
			this.$year = $('#year');
			this.$genre = $('.mood li p');
			this.$moodItem = $('.mood li');
			this.$moodIcon = $('.mood i');
			this.$formUrl = $('form#url');
			this.$mobileArrow = $('.fa-angle-down')
			this.$movieIsland = $('.movie-island')
			this.$teleportme = $('.teleportme')
			this.$btr = $('.btr')
		},
		render: function(){
			this.$slider.val(this.setup.year)
			this.$year.text(this.setup.year)
		},
		bindEvents: function(){
			this.$slider.on('change mousemove', this.preferencesSetup.bind(this))
			this.$help.on('click', this.toggleHidden.bind(this))
			this.$flag.on('click',this.moodToggleHide.bind(this))
			this.$songInfoWrapper.on('click','.add i' , this.addVideo)
			this.$moodItem.on('click', this.genreSelector)
			this.$formUrl.on('submit', this.uploadLink)
			this.$close_btn.on('click', this.closeInfo)
			this.$songInfoWrapper.on('click','.like' , this.like)
			this.$songInfoWrapper.on('click','.submit-comment' , this.comment)
			this.$mobileArrow.on('click', this.hideSongbox)
			this.$movieIsland.on('click', this.soundtrack)
			this.$teleportme.on('click', this.teleport)
			this.$btr.on('click', this.close_teleport)
		},
		preferencesSetup: function(){
			this.setup.year = this.$slider.val()
			localStorage.setItem("setup", JSON.stringify({year: this.setup.year, genre: this.setup.genre}))
			$('#year').text(this.setup.year)
		},
		pickupGenre: function(index,element){
			$(this).removeClass('clicked')
			if($(this).text() === self.setup.genre){
				$(this).siblings().addClass('clicked')
			}
		},
		genreSelector: function(){
			self.$moodIcon.removeClass('clicked')
			$(this).find('i').addClass('clicked')
			self.setup.genre = $(this).text()
 			localStorage.setItem("setup", JSON.stringify({year: self.setup.year, genre: self.setup.genre}))
		},
		toggleHidden: function(){
			$('.start').toggleClass('hidden')
		},
		moodToggleHide: function(){
			$('.mood').toggleClass('hide')
		},
		addVideo: function(){
			$('.post-song').toggleClass('hidden')
		},
		hideSongbox: function(){
			$('.song-info').slideToggle()
		},
		closeInfo: function(){
			$(this).parent().addClass('hidden')
		},
		updateComments: function(comments){
			console.log('cos')
			var item = Math.floor(Math.random() * comments.length);
			$('.user_comment').remove()
			var user_comment = ejs.render(self.commentTemplate, {comments: comments[item]})
			$('.users_comments').append(user_comment)
		},
		loadMap: function(){
			jQuery('#vmap').vectorMap({
				map: 'world_en',
				selectedColor: '#ffcccc',
				color: '#fdfcc4',
				enableZoom: true,
				showTooltip: true,
				onRegionClick : function (element, code, region){
					//Grab the info about the country

					var country = region.replace(' ','_')
					self.setup.country = country
					//Making request to discogs api
					$.ajax({
						type: 'POST',
						url: '/radioo',
						data: self.setup,
						dataType: 'json',
						success: function(data){
							console.log(data)
							$('.song-info').remove()
							var html = ejs.render(self.songBoxTemplate ,{album_info: data})
							$('.song-info-wrapper').append(html)
							localStorage.setItem("album_info", JSON.stringify(data));
							if(self.refreshComment){
								clearInterval(self.refreshComment)
							}
							if(data.video_info.comments){
								self.refreshComment = setInterval(self.updateComments, 5000, data.video_info.comments)
							}
							
						}
					});
				}

			});
		},
		uploadLink: function(e){
			var youtube_link = $('input[type=text]').val()
			db_query = {
				youtube_link: youtube_link,
				album_info: JSON.parse(localStorage.getItem("album_info")),
				setup: JSON.parse(localStorage.getItem("setup"))
			}
			e.preventDefault()
			$.ajax({
				type: 'POST',
				url: '/upload',
				data: db_query,
				dataType: 'json',
				success: function(data){
				}
			});
		},
		like: function(){
			var album_info = JSON.parse(localStorage.getItem("album_info"))

			$.ajax({
				type: 'POST',
				url: '/like',
				data: album_info,
				dataType: 'json',
				success: function(data){
					console.log(data)

					if(!data.info){
						$('.likes').remove()
						var likes = ejs.render(self.likesTemplate, {likes: data.likes})
						$('.fa-heart').append(likes)
					}else{
						$('.login-alert-info').removeClass('hidden')
					}
				}
			});
		},
		comment: function(){
			var album_info = JSON.parse(localStorage.getItem("album_info"))
			var comment =  $('#comment').val()
			$.ajax({
				type: 'POST',
				url: '/comment',
				data: {
						comment: comment,
						album_info: album_info
					},
				dataType: 'json',
				success: function(data){
					console.log(data)
					if(!data.info){
						$('.user_comment').remove()
						var user_comment = ejs.render(self.commentTemplate, {comments: data.comments[0]})
						$('.users_comments').append(user_comment)
					}else{
						$('.login-alert-info').removeClass('hidden')
					}
				}
			});
		},
		soundtrack: function(){

			$.ajax({
				type: 'POST',
				data: {soundtrack: 'soundtrack'},
				url: '/radioo',
				success: function(data){
					$('.song-info').remove()
					var html = ejs.render(self.songBoxTemplate ,{album_info: data})
					$('.song-info-wrapper').append(html)
					if(self.refreshComment){
						clearInterval(self.refreshComment)
					}
					if(data.video_info.comments){
						self.refreshComment = setInterval(self.updateComments, 5000, data.video_info.comments)
					}

				}
			});
		},
		teleport: function(){
			$('#street-view').css({display: 'block'})
			$('.gm-style').remove()
			var item = Math.floor(Math.random() * locations.length)
			var place = locations[item];
			 self.panorama;
				console.log(place)
				function initialize() {
				 self.panorama = new google.maps.StreetViewPanorama(
					document.getElementById('street-view'),
					{	
						position: {lat: place[0] , lng: place[1]},
						pov: {heading: 165, pitch: 0},
						zoom: 1
					});
			}
			initialize()

			$('#street-view').css({
				height: '100vh',
				width: 	'100vw'
			})


			
		},
		close_teleport: function(){

				$('#street-view').css({display: 'none'})

				$('.gm-style').remove()

		}
	}

	songInfoBox.init();
});