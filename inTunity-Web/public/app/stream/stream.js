app = angular.module('inTunity.stream', [
    'auth0', 'ngCookies'
]);

app.controller('StreamCtrl', function StreamController($scope, auth, $http, $location, store, $compile, musicStatus,$cookies, $rootScope) {
    
	//Loads the current player state (song number, song position, song pause state) from the user cookies.
	$scope.loadSongDataFromCookies = function(){
		var songNum = ($cookies.get('songNum') != null) ? $cookies.get('songNum') : 0 ;
		var songPos = ($cookies.get('songPos') != null) ? $cookies.get('songPos') : -1 ;
		var songPaused = ($cookies.get('songPaused') != null) ? $cookies.get('songPaused') : false ;
			
		//Update the music status via cookie data
		musicStatus.setStatus(songNum, songPos, songPaused);
	}
	
	//Check if we reached this page from another page. If so, keep the music state active.
	$scope.routeFromAnotherPage = function(){
		var startSpecific = ($cookies.get('routeChange') != null) ? $cookies.get('routeChange') : true ;
		
		//Update the route change information
		$cookies.put('routeChange', false);
	}
	
	//Stores our song state into the user cookies. Called when page routing and logging out.
	$scope.updateCookieData = function(){
        curStats = musicStatus.getStatus();
        $cookies.put('songNum', curStats[0], {expires: expirationDate});
        $cookies.put('songPos', curStats[1], {expires: expirationDate});
	}


	//Updates cookie data if Angular detects movement to another page (within Intunity).
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        $cookies.put('routeChange', true, {expires: expirationDate});
        $scope.updateCookieData();
    });
	
	
	//Loads user and track information
	$scope.loadUserAndTracks = function(){
		$scope.auth = auth;
		$scope.tgState = false;
		var prof = (store.get('profile'));
		$scope.owner;
		var id = prof["identities"][0]["user_id"];

		console.log(prof);


		var globalPlayer;
		var trackarray = [];

		var username_url;

		var expirationDate = new Date();
		var numberOfDaysToAdd = 10;
		expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd); 
		
		//Sets user display name?
		if (prof["given_name"] != null) {
			$scope.owner = prof["given_name"];
		} else {
			$scope.owner = prof["nickname"];
		}
	}
  	
	
	$scope.loadSongDataFromCookies();
	$scope.routeFromAnotherPage();
	$scope.loadUserAndTracks();
	
	//Navigates to another profile
    $scope.otherprofiles = function(username) {
      store.set('username_clicked', username);
      $location.path("/profile/" + username);
    }

	//Logout of Intunity
    $scope.logout = function() {
        if (trackarray.length > 0) {
            console.log("hit here");
            window.globalPlayer.pause();
        }
        auth.signout();
        store.remove('profile');
        store.remove('token');
        $location.path('/login');
			
		//STORE COOKIE DATA
		$scope.updateCookieData();
		
		//STOP SOUND PLAYER
		window.globalPlayer.pause();
    }

	//Load profile information
    $scope.profile = function() {
        var ppl = store.get('profile');
        var ppl_id = ppl["identities"][0]["user_id"];


        $http({
            url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/specificUser',
            method: 'GET',
            params: {
                id: ppl_id
            }
        }).then(function(response) {
            console.log(response["data"]["user"]);

            console.log(username_url);
            username_url = response["data"]["user"]["url_username"];
            // console.log(username_url);
            store.set('username_clicked', username_url);
            $location.path('/profile/' + username_url);


        }); // end of http get
    }

	//Navigate to home page
    $scope.home = function() {
        $location.path('/');
    }

	//Navigate to add song page
    $scope.addSong = function() {
        // if (trackarray.length > 0) {
        //   globalPlayer.pause();
        // }
        $location.path('/add-song');

    }

	//Navigate to about page
    $scope.about = function() {
        $location.path('/about');
    }

	//Convert milliseconds to (MM:SS)
    function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

	// Goes to the correct position in the screen when songs changes
	function findPos(obj) {
		var curtop = 0;
		if (obj.offsetParent) {
			do {
				curtop += obj.offsetTop - 50;
			} while (obj = obj.offsetParent);
			return [curtop];
		}
	}


	// console.log(SC.resolve("https://soundcloud.com/octobersveryown/remyboyz-my-way-rmx-ft-drake"));

	//Grab HTML Objects
	$scope.time = document.getElementById("time");
	$scope.progressBall = document.getElementById('playHead');
	$scope.songDuration = 0;

	//Set the graphics of the player instantly
	$scope.setGraphics = function(){
		songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
		currentuser = document.getElementById("currentuser");
		currentuser.innerHTML = correctUsers[song_count][0]["nickname"];
		var album = document.getElementById("artwork");
		album.src = trackarray[song_count % trackarray.length][1];
		var title = document.getElementById("songtitle");
		title.innerHTML = trackarray[song_count % trackarray.length][2];
		var endTime = document.getElementById("endTime");
		songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
		endTime.innerHTML = millisToMinutesAndSeconds(songDuration);
	}
	
	//Color-Thief background changer
	$scope.changeBack = function(){
		// this is used to change the background for player using color-thief
		var image = document.createElement("img");
		image.crossOrigin = "Anonymous";
		image.src = trackarray[song_count % trackarray.length][1];
		image.onload = function(){
			var colorThief = new ColorThief();
			var cp = colorThief.getPalette(image, 2, 5);
			// var color = colorThief.getColor(image); 
			document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb('+cp[2][0]+','+cp[2][1]+','+cp[2][2]+'))';
		};
	}
	
	//Start the SoundCloud Stream!
	function startStream(newSoundUrl, startingPosition) {
		$scope.setGraphics();
		SC.stream(newSoundUrl).then(function(player) {
			globalPlayer = player
			window.globalPlayer = player;
			
			//Check if we are in pause/play state
			if (startingPosition != -2000) {
				window.globalPlayer.play();
			} else {
				$scope.pause();
			}

			globalPlayer.seek(startingPosition);

			//Add on Play-Start event code
			globalPlayer.on('play-start', function() {
				//Whether we should start specific or not
				if (startSpecific == false){
					globalPlayer.seek(startingPosition);
				} else {
					songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
				}
				

				//If we are on the Home Page
				if ($location.path() == "/") {
					//this is for resetting all the background color to its natural settings
					for (var i = 0; i < trackarray.length; i++) {
						var row = document.getElementById("song" + i);
						row.style.backgroundColor = "#f5f5f5";
					}

					// this targets which row to highlight
					var rowCurrent = document.getElementById("song" + song_count);
					rowCurrent.style.backgroundColor = "#ffe4c4";
					window.scroll(0, findPos(rowCurrent));

				}
			});


			
			//Event asynchronously runs while the song is streaming
			globalPlayer.on('time', function() {
				//Updates information about our currently playing song (shared cross page)
				if (globalPlayer.currentTime() < parseInt(trackarray[song_count % trackarray.length][3])) {
					//Set music status
					musicStatus.setStatus(song_count % trackarray.length, globalPlayer.currentTime(),false);
					
					//Update cookie data
					$scope.updateCookieData();
				}
				
				songDuration = parseInt(trackarray[song_count % trackarray.length][3]);

				var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
				progressBall.style.width = percent + "px";

				var currentTime = document.getElementById("currentTime");
				currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());


				if (globalPlayer.currentTime() <= (songDuration * 0.02)) {
					globalPlayer.setVolume(0.8);
				}

				if ((globalPlayer.currentTime() > (songDuration * 0.02)) && (globalPlayer.currentTime() < (songDuration * 0.98))) {
					globalPlayer.setVolume(1);
				}

				if (globalPlayer.currentTime() >= (songDuration * 0.98)) {
					globalPlayer.setVolume(0.8);
				}

			});



			globalPlayer.on('finish', function() {
				var length = parseInt(trackarray[song_count % trackarray.length][3]);
				if (length == globalPlayer.currentTime()) {
					song_count += 1;
					musicStatus.setStatus(song_count % trackarray.length, globalPlayer.currentTime());
					musicStatus.setStatus(song_count % trackarray.length, 0);
					new_song = trackarray[song_count % trackarray.length][0];
					song_count = song_count % trackarray.length;
					new_url = '/tracks/' + new_song;
					console.log(new_url);
					globalPlayer.seek(0); //Do this before startStream
					startStream(new_url, 0);
				}

			}); // end of finish

		});
	}




	//Handles the progress bar.


	if (trackarray.length > 0) {
		var playHead = document.getElementById('playHead');
		var timelineWidth = time.offsetWidth - playHead.offsetWidth;

		time.addEventListener('click', function(event) {
			changePosition(event);
		}, false);

		function changePosition(click) {
			console.log($location.path());
			var timelength = window.globalPlayer.streamInfo["duration"];//parseInt(trackarray[song_count % trackarray.length][3]);
			var col1 = document.getElementById("col1");

			console.log($(window).width());

			var marginLeft;
			if ($(window).width() < 992) {
				console.log("here");
				marginLeft = click.pageX - 10;
			} else {
				console.log("here!");
				marginLeft = click.pageX - col1.offsetWidth - 10;
			}

			var percentageClicked = (marginLeft / time.offsetWidth);

			console.log(percentageClicked);
			window.globalPlayer.seek(Math.floor(percentageClicked * timelength));
			var currentTime = percentageClicked * timelength;
			progressBall.style.width = ((currentTime / timelength) * time.offsetWidth) + "px";

		}



	}




    }); // end of http get



});