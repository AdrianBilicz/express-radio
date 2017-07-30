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
					console.log(data)
					// localStorage.setItem("album_info", JSON.stringify(data));
					// location.reload()

				}
			});
		}
		// onRegionOver: function(event, code, region)
		// {
		// 	$('.jqvmap-label').text(loading)
		// 	setup.country = region
		// 	$.ajax({
		// 		type: 'POST',
		// 		url: '/albums',
		// 		data: setup,
		// 		dataType: 'json',
		// 		success: function(data){
		// 			// console.log(data)
		// 			var label = `${region} ${data} albums to discover`
		// 			$('.jqvmap-label').text(label)

		// 		}
		// 	});
		// },
	});

});