window.fbAsyncInit = function ()
{
	FB.init({
		appId: '549298755225234',
		xfbml: true,
		version: 'v2.5'
	});

	function renderPhotos(urls)
	{
		var parent = document.getElementById("photo-container");

		for (var i = 0; i < urls.length; i++)
		{
			var ele = '';// document.createElement("img");

			ele += '<div class="item option-' + (i%4) +'" style="background-image: url(' + urls[i] + ');">';
			ele += '<a href="#" class="button-edit"></a>';
			ele += '<div class="menu" style="display: none">';
			ele += '<h1>Where can your photo be used?</h1>';
			ele += '<ul>';
			ele += '<li><a href="#" data-val="option-1">Nowhere out of Facebook</a></li>';
			ele += '<li><a href="#" data-val="option-2">Restricted</a></li>';
			ele += '<li><a href="#" data-val="option-3">Anywhere</a></li>';
			ele += '</ul>';
			ele += '</div>';
			ele += '</div>';

			$(parent).append(ele);
		}
	}

	function initEdit() {
		var $menus = $('.menu');

		$('.button-edit').on('click', function (e) {
			e.preventDefault();
			$menus.hide();
			$(this).next().show();
		});

		$('.menu').on('click', 'a', function (e) {
			e.preventDefault();
			$(this).closest('.item').removeClass('option-0').removeClass('option-1').removeClass('option-2').removeClass('option-3').addClass($(this).attr('data-val'));
			$menus.hide();

			showModal();
		});
	}
	function showModal() {
		$('#overlay').fadeIn();

		setTimeout(function () {
			$('#overlay').fadeOut();

			showShareModal();
		},1000);
	}
	function showShareModal() {
		alert('SHARE!');
	}

	function fetchPhotoUrls(photo_ids, callback)
	{
		var batch = [];

		for (var i = 0; i < 50; i++)
		{
			batch.push({method: 'GET', relative_url: photo_ids[i] + '?fields=picture'});
		}

		FB.api('/', 'POST', {batch: batch}, function (images)
		{
			console.dir(images);

			var urls = [];
			for (var i = 0; i < images.length; i++)
			{
				urls.push(JSON.parse(images[i].body).picture);
			}

			console.dir(urls);
			callback(urls);
		});
	}

	function fetchPhotoIds(albums, callback)
	{
		var batch = [];

		for (var i = 0; i < albums.data.length; i++)
		{
			batch.push({method: 'GET', relative_url: albums.data[i].id + '/photos'});
		}

		FB.api('/', 'POST', {batch: batch}, function (photos)
		{
			console.dir(photos);

			var photo_ids = [];

			for (var i = 0; i < photos.length; i++)
			{
				var per_album = JSON.parse(photos[i].body).data;

				for (var j = 0; j < per_album.length; j++)
				{
					photo_ids.push(per_album[j].id);
				}
			}

			console.dir(photo_ids);
			callback(photo_ids);
		});
	}

	function fetchAlbums(user, callback)
	{
		FB.api('/' + user.id + '/albums', function (albums)
		{
			console.dir(albums);
			callback(albums);
		})
	}

	function fetchUser(callback)
	{
		FB.api('/me?fields=first_name', function (user)
		{
			console.dir(user);
			callback(user);
		});
	}

	function renderWelcome(user)
	{
		var welcomeBlock = document.getElementById('fb-welcome');
		welcomeBlock.innerHTML = 'Welcome ' + user.first_name + ' to MiPhotoz';
	}

	function postMessage()
	{
		FB.ui({
			method: 'share',
			href: 'https://apps.facebook.com/miphotoz'
		}, function (response) {});
	}

	function loadPage()
	{
		fetchUser(function (user)
		{
			renderWelcome(user);

			fetchAlbums(user, function (albums)
			{
				fetchPhotoIds(albums, function (photo_ids)
				{
					fetchPhotoUrls(photo_ids, function (photo_urls)
					{
						renderPhotos(photo_urls);
						initEdit();
						postMessage();
					});
				});
			});
		});
	}

	function onLogin(response)
	{
		if (response.status == 'connected')
		{
			loadPage();
		}
	}

	FB.getLoginStatus(function (response)
	{
		// Check login status on load, and if the user is
		// already logged in, go directly to the welcome message.
		if (response.status == 'connected')
		{
			onLogin(response);
		}
		else
		{
			// Otherwise, show Login dialog first.
			FB.login(function (response)
			{
				onLogin(response);
			}, {scope: 'user_friends, email, user_photos'});
		}
	});
};

(function (d, s, id) //load facebook js SDK
{
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id))
	{
		return;
	}
	js = d.createElement(s);
	js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));