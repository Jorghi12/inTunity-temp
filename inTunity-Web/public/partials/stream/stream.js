app = angular.module('inTunity.stream', [
    'auth0', 'ngCookies'
]);

app.controller('StreamCtrl', function StreamController($scope, auth, $http, $location, store, $compile, musicStatus, $cookies, $rootScope) {
    SC.initialize({
        client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
    });

	$scope.confirmSong = false;
	$scope.trackID;
	
	//Load Track Data
    $http({
         url: 'http://localhost:3001/secured/account',
        method: 'GET'
    }).then(function(response) {
        var users = response["data"]["songs"];
		window.legend = response;
        // this array has users who only have songs for today with it
        $scope.correctUsers = [];

        // makes sure we only show users who have songs
        for (var i = 0; i < users.length; i++) {
            if (users[i]["today_song"].length > 0) {

                var date = new Date(users[i]["today_song"][0]["unix_time"] * 1000);
                var year = date.getFullYear();
                var month = date.getMonth();
                var day = date.getDate();
                var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
                var formmatedDay = monthNames[month] + " " + day + ", " + year;
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();
                var am_pm = "AM";
                if (hours == 12) {
                    am_pm = "PM";
                }
                if (hours > 12) {
                    hours = hours - 12;
                    am_pm = "PM";
                }
                if (hours == 0) {
                    hours = 12;
                }

                var formattedTime = hours + ':' + minutes.substr(-2) + " " + am_pm;
                $scope.correctUsers.push({
                    user: new Array(users[i]),
                    formattedTime: formattedTime,
                    formmatedDay: formmatedDay,
                    unix_time: users[i]["today_song"][0]["unix_time"] * 1000
                })

            } else {

            }
        } // end of for loop


        //Sort Correct Users by Unix Time
        $scope.correctUsers.sort(function(a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.unix_time) - new Date(a.unix_time);
        });



        $scope.users = $scope.correctUsers;



        $scope.trackarray = [];

        for (var i = 0; i < $scope.correctUsers.length; i++) {
            $scope.trackarray.push(new Array($scope.correctUsers[i]["user"][0]["today_song"][0]["track_id"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_album_pic"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_title"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_duration"]));
        }

        console.log($scope.trackarray);

        //Grab HTML Objects
        $scope.time = document.getElementById("time");
        $scope.songDuration = 0;


        //Handles the progress bar.
        if ($scope.trackarray.length > 0) {
            var playHead = document.getElementById('playHead');
            var timelineWidth = time.offsetWidth - playHead.offsetWidth;

            time.addEventListener('click', function(event) {
                changePosition(event);
            }, false);

            function changePosition(click) {
                var timelength = window.globalPlayer.streamInfo["duration"];
                var col1 = document.getElementById("col1");

                console.log($(window).width());

                var marginLeft;
                if ($(window).width() < 992) {
                    marginLeft = click.pageX - 10;
                } else {
                    marginLeft = click.pageX - col1.offsetWidth - 10;
                }

                var percentageClicked = (marginLeft / time.offsetWidth);
                window.globalPlayer.seek(Math.floor(percentageClicked * timelength));
                var currentTime = percentageClicked * timelength;
                var progressBall = document.getElementById('playHead');
                progressBall.style.width = ((currentTime / timelength) * time.offsetWidth) + "px";

            }



        }

        $scope.autoStart();
    });
	
    //Load player Paused state
    var paused = (musicStatus.getStatus()[2] != null) ? musicStatus.getStatus()[2] : false;
    $scope.song_count = 0;

    //Loads the current player state (song number, song position, song pause state) from the user cookies.
    $scope.loadSongDataFromCookies = function() {
        var songNum = ($cookies.get('songNum') != null) ? $cookies.get('songNum') % $scope.trackarray.length : 0;
        var songPos = ($cookies.get('songPos') != null) ? $cookies.get('songPos') : -1;
        var songPaused = ($cookies.get('songPaused') != null) ? $cookies.get('songPaused') : false;

        //Update the music status via cookie data
        musicStatus.setStatus(songNum, songPos, songPaused);

        return [songNum, songPos, songPaused];
    }

    //Check if we reached this page from another page. If so, keep the music state active.
    $scope.routeFromAnotherPage = function() {
        var startSpecific = ($cookies.get('routeChange') != null) ? $cookies.get('routeChange') : true;

        //Update the route change information
        $cookies.put('routeChange', false);

        //Return information
        return startSpecific;
    }

    //Stores our song state into the user cookies. Called when page routing and logging out.
    $scope.updateCookieData = function() {
        var curStats = musicStatus.getStatus();
		var isPaused = (window.globalPlayer != null) ? !window.globalPlayer._isPlaying : false;
	
        $cookies.put('songNum', curStats[0], {
            expires: $scope.cookieExpirationDate()
        });
        $cookies.put('songPos', curStats[1], {
            expires: $scope.cookieExpirationDate()
        });
        $cookies.put('songPaused', isPaused, {
            expires: $scope.cookieExpirationDate()
        });
    }


    //Updates cookie data if Angular detects movement to another page (within Intunity).
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        $cookies.put('routeChange', true, {
            expires: $scope.cookieExpirationDate()
        });
		
		//If just logging in don't update cookies + turn on auto play
		if (current["loadedTemplateUrl"] == "/partials/login/login.html"){
			$cookies.put('songPaused', false, {
				expires: $scope.cookieExpirationDate()
			});
		}
		else{
			$scope.updateCookieData();
		}
    });


    //Return our preset Expiration Dates for new Cookies
    $scope.cookieExpirationDate = function() {
        //Perhaps in the future optimize this based on our findings
        var expirationDate = new Date();
        var numberOfDaysToAdd = 10;
        expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd);

        //Return the Date Object
        return expirationDate;
    }

    //Loads user information
    $scope.loadUsers = function() {
        $scope.auth = auth;
        $scope.tgState = false;
        var prof = (store.get('profile'));

        var id = prof["identities"][0]["user_id"];

        // console.log(prof);

        //Sets user display name
        if (prof["given_name"] != null) {
            $scope.owner = prof["given_name"];
        } else {
            $scope.owner = prof["nickname"];
        }
    }


    //Logout of Intunity
    $scope.logout = function() {
        auth.signout();
        store.remove('profile');
        store.remove('token');
        $location.path('/login');

        //STORE COOKIE DATA
        $scope.updateCookieData();

        //STOP SOUND PLAYER
        if (window.globalPlayer != null) {
            window.globalPlayer.pause();
        }
    }

    //Allow all pages to access logout
    window.logout = $scope.logout;

   



    //Convert milliseconds to (MM:SS)
    $scope.millisToMinutesAndSeconds = function(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    // Goes to the correct position in the screen when songs changes
    $scope.findPos = function(obj) {
        var curtop = 0;
        if (obj.offsetParent) {
            do {
                curtop += obj.offsetTop - 50;
            } while (obj = obj.offsetParent);
            return [curtop];
        }
    }

    //Set the graphics of the player instantly
    $scope.setGraphics = function(userDisplayName,artworkUrl,title,songDuration) {
        currentuser = document.getElementById("currentuser");

        currentuser.innerHTML = userDisplayName;

        var album = document.getElementById("artwork");
        album.src = (artworkUrl != null) ? artworkUrl : "/images/no-art.png";
		
        var titleObj = document.getElementById("songtitle");
        titleObj.innerHTML = title;
        var endTime = document.getElementById("endTime");
        endTime.innerHTML = $scope.millisToMinutesAndSeconds(songDuration);

        $scope.changeBack(album.src);
    }

    //Apply the Color-Thief background transformation
    $scope.changeBack = function(image_source) {
        // this is used to change the background for player using color-thief
        var image = document.createElement("img");
        image.crossOrigin = "Anonymous";
        image.src = image_source;
        image.onload = function() {
            var colorThief = new ColorThief();
            var cp = colorThief.getPalette(image, 2, 5);
            // var color = colorThief.getColor(image); 
            document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb(' + cp[2][0] + ',' + cp[2][1] + ',' + cp[2][2] + '))';
        };
    }

    //Updates the graphics of the player GUI
    $scope.updateCurrentPlayerGraphics = function(songDuration) {
		$scope.time = document.getElementById("time");
		
        globalPlayer = window.globalPlayer;

        //songDuration = parseInt($scope.trackarray[$scope.song_count % $scope.trackarray.length][3]);
		
        var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
        var progressBall = document.getElementById('playHead');
        progressBall.style.width = percent + "px";
        var currentTime = document.getElementById("currentTime");
        currentTime.innerHTML = $scope.millisToMinutesAndSeconds(globalPlayer.currentTime());
    }


    // when you press on album pic, it will play that song
    $scope.playSpecificSong = function(index) {
        //If we're already on that song, just toggle. --- Design Update
        if ($scope.song_count == index && window.globalPlayer != null) {
            $scope.pause();
            return;
        }

        $scope.song_count = index;
        var pauseButton = document.getElementById('pauseButton');
        pauseButton.innerHTML = "<h4>Pause</h4>";
		//if (window.globalPlayer != null ){window.globalPlayer.seek(0);}
        $scope.startStream($scope.song_count, 0);
    }

    // this is for skipping to the previous song
    $scope.prevPlayer = function() {
        if ($scope.song_count == 0) {
            $scope.song_count = 0;
			//if (window.globalPlayer != null && window.globalPlayer._isPlaying == true){
				//Don't interrupt
			//	return;
			//}
        }
		else{
			$scope.song_count = ($scope.song_count - 1) % $scope.trackarray.length;
		}
		
        var pauseButton = document.getElementById('pauseButton');
        pauseButton.innerHTML = "<h4>Pause</h4>";
		//if (window.globalPlayer != null ){window.globalPlayer.seek(0);}
		
        $scope.startStream($scope.song_count, 0);
    }

    // this is for skipping to the next song
    $scope.nextPlayer = function() {
        $scope.song_count = ($scope.song_count + 1) % $scope.trackarray.length;

        var pauseButton = document.getElementById('pauseButton');
        pauseButton.innerHTML = "<h4>Pause</h4>";
		//if (window.globalPlayer != null ){window.globalPlayer.seek(0);}
		
        $scope.startStream($scope.song_count, 0);
    }


    //Toggle (play/pause) the current song
    $scope.pause = function() {
        var pauseButton = document.getElementById('pauseButton');
		
		//No song has ever started.
		if (window.globalPlayer == null){
			$scope.startStream($scope.song_count, 0);
            pauseButton.innerHTML = "<h4>Pause</h4>";
			return;
		}
		
        if (window.globalPlayer._isPlaying) {
            window.globalPlayer.pause();
            pauseButton.innerHTML = "<h4>Play</h4>";
        } else {
            window.globalPlayer.play();
            pauseButton.innerHTML = "<h4>Pause</h4>";
        }

        //Update the music status via cookie data
        musicStatus.setStatus($scope.song_count % $scope.trackarray.length, globalPlayer.currentTime(), !window.globalPlayer._isPlaying);

        $cookies.put('songPaused', !window.globalPlayer._isPlaying, {
            expires: $scope.cookieExpirationDate()
        });

    }

	//Start the SoundCloud Stream (From MainPlaylist)
	$scope.startStream = function(song_count, pos){
		songUrl = "";
		artworkUrl = $scope.trackarray[$scope.song_count % $scope.trackarray.length][1];
		myTitle =  $scope.trackarray[$scope.song_count % $scope.trackarray.length][2];
		trackid = $scope.trackarray[$scope.song_count][0];
		songDuration = parseInt($scope.trackarray[$scope.song_count % $scope.trackarray.length][3]);
		pagetype = "home";
		userDisplay = ($scope.correctUsers[$scope.song_count]["user"][0]["nickname"] != null) ? $scope.correctUsers[$scope.song_count]["user"][0]["nickname"] : $scope.correctUsers[$scope.song_count]["user"][0]["given_name"];
		
		$scope.setGraphics(userDisplay,artworkUrl,myTitle,songDuration);
		
		$scope.startStreamFULL(songUrl, artworkUrl, myTitle, trackid, songDuration, userDisplay, pagetype, pos);
	}
		
    //Start the SoundCloud Stream!
	$scope.startStreamFULL = function(songUrl, artworkUrl, myTitle, trackid, songDuration, userDisplay, pagetype, pos) {
        $scope.setGraphics(userDisplay,artworkUrl,myTitle,songDuration);
		$scope.trackID = trackid;
		if (pagetype == "profile"){
			  var prevButton = document.getElementById("prevButton");
			  prevButton.style.visibility = "hidden";

			  var nextButton = document.getElementById("nextButton");
			  nextButton.style.visibility = "hidden";
		}
		else if (pagetype == "addsong"){
			  var prevButton = document.getElementById("prevButton");
			  prevButton.style.visibility = "hidden";

			  var nextButton = document.getElementById("nextButton");
			  nextButton.style.visibility = "hidden";

			  var poster = document.getElementById("currentuser");
			  poster.style.visibility = "hidden";
 
			  var selectedBy = document.getElementById("selectedBy");
			  selectedBy.style.visibility = "hidden";



			  var playerButtons = document.getElementById("playerButtons");

                var confirmButton = document.createElement("button");
		  if ($scope.confirmSong == false){

			  
              var numClicked = 0;
			  confirmButton.onclick = function() {

                // this is to prevent button smashing (i.e. getting like 5 same songs)
                numClicked += 1;
                if (numClicked == 1) {
                    $scope.selectSong(songUrl, artworkUrl, myTitle, trackid, songDuration);
                }
				
			  }

			  var confirmTitle = document.createElement("h4");
			  confirmTitle.setAttribute("id", "confirmTitle");
			  
			  confirmTitle.innerHTML = "Confirm";
			  confirmButton.appendChild(confirmTitle);
			  confirmButton.setAttribute("id", "playerConfirm");
			  confirmButton.className = "playerButton";
			  confirmButton.style = "margin:30px 0px; min-height:50px;";
			  playerButtons.appendChild(confirmButton);

			  $scope.confirmSong = true;
		  }
		  else{
              var numClicked = 0;
			  var confirmButton = document.getElementById("playerConfirm");
			  confirmButton.onclick = function() {

                // this is to prevent button smashing (i.e. getting like 5 same songs)
                numClicked += 1;
                if (numClicked == 1) {
                    $scope.selectSong(songUrl, artworkUrl, myTitle, trackid, songDuration);
                }
				
			  }
			  
			  var confirmButton = document.getElementById("playerConfirm");
			  confirmButton.style.visibility = "visible";
			  
			  var confirmTitle = document.getElementById("confirmTitle");
			  confirmTitle.style.visibility = "visible";
		  }
		}
		
        SC.stream("/tracks/" + trackid).then(function(player) {
            globalPlayer = player
            window.globalPlayer = player;

			//If not Start Paused
			if (pos != -2000){
				var pauseButton = document.getElementById('pauseButton');
				pauseButton.innerHTML = "<h4>Pause</h4>";
				window.globalPlayer.play();
			}
			
		
			
			//If we are on the Home Page
			if ($location.path() == "/") {
				//this is for resetting all the background color to its natural settings
				for (var i = 0; i < $scope.trackarray.length; i++) {
					var row = document.getElementById("song" + i);
					row.style.backgroundColor = "#f5f5f5";
				}

				// this targets which row to highlight
				var rowCurrent = document.getElementById("song" + $scope.song_count);
				rowCurrent.style.backgroundColor = "#ffe4c4";
				window.scroll(0, $scope.findPos(rowCurrent));

			}
			
            //Add on Play-Start event code
            globalPlayer.on('play-start', function() {
                //songDuration = parseInt($scope.trackarray[$scope.song_count % $scope.trackarray.length][3]);
				if (pos == 0){
					window.globalPlayer.seek(0);
				}
				
            });

            //Event asynchronously runs while the song is streaming
            globalPlayer.on('time', function() {
                //Updates information about our currently playing song (shared cross page)
                if (globalPlayer.currentTime() < songDuration) {
                    //Set music status
					if (pagetype == "home"){
						musicStatus.setStatus($scope.song_count % $scope.trackarray.length, globalPlayer.currentTime(), false);
					}
					
                    //Update cookie data
                    $scope.updateCookieData();
                }

                //Updates the current state of the player footer GUI
                $scope.updateCurrentPlayerGraphics(songDuration);

                //Cool Sound Effects
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
				if (pagetype == "home" || $location.path() == "/") {
					var length = parseInt($scope.trackarray[$scope.song_count % $scope.trackarray.length][3]);
				}
				else{
					var length = songDuration;
				}
			
                if (length == globalPlayer.currentTime()) {
					//Return to Pause Mode for addsong + profile
					if ((pagetype == "addsong" || pagetype == "profile") && $location.path() != "/"){
						var pauseButton = document.getElementById('pauseButton');
						pauseButton.innerHTML = "<h4>Play</h4>";
						globalPlayer.seek(0); //Do this before startStream
						$scope.startStream($scope.song_count, -2000);
						
						
			  var prevButton = document.getElementById("prevButton");
			  prevButton.style.visibility = "visible";

			  var nextButton = document.getElementById("nextButton");
			  nextButton.style.visibility = "visible";

			  var poster = document.getElementById("currentuser");
			  poster.style.visibility = "visible";
 
			  var selectedBy = document.getElementById("selectedBy");
			  selectedBy.style.visibility = "visible";

			  var confirmButton = document.getElementById("playerConfirm");
			  confirmButton.style.visibility = "hidden";
			  
			  var confirmTitle = document.getElementById("confirmTitle");
			  confirmTitle.style.visibility = "hidden";

			  $scope.confirmSong = true;
					}
					else
					{
						$scope.song_count = ($scope.song_count + 1) % $scope.trackarray.length;
						musicStatus.setStatus($scope.song_count, 0, false);
						globalPlayer.seek(0); //Do this before startStream
						$scope.startStream($scope.song_count, 0);
					}
					
                }

            }); // end of finish

        });
    }

    window.startStreamCustom = $scope.startStreamFULL;

	//Load next song (used for Profile where we may delete a song that's currently playing.. want to go to main feed)
	$scope.nextSong = function(trackID){
		//Currently Playing Song
		if ($scope.trackID == trackID){
			//Continue playing previous song. ($scope.song_count) instead of ($scope.song_count + 1)
			$scope.updateTrackSongs();
		}
	}
	window.nextSong = $scope.nextSong;
	
	//Update the Mainfeed TrackSongs
	//Load Track Data
	$scope.updateTrackSongs = function(){
		$http({
            url: 'http://localhost:3001/secured/account',
            method: 'GET'
        }).then(function(response) {
            var users = response["data"]["songs"];

            // this array has users who only have songs for today with it
            $scope.correctUsers = [];

            // makes sure we only show users who have songs
            for (var i = 0; i < users.length; i++) {
                if (users[i]["today_song"].length > 0) {

                    var date = new Date(users[i]["today_song"][0]["unix_time"] * 1000);
                    var year = date.getFullYear();
                    var month = date.getMonth();
                    var day = date.getDate();
                    var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
                    var formmatedDay = monthNames[month] + " " + day + ", " + year;
                    var hours = date.getHours();
                    var minutes = "0" + date.getMinutes();
                    var am_pm = "AM";
                    if (hours == 12) {
                        am_pm = "PM";
                    }
                    if (hours > 12) {
                        hours = hours - 12;
                        am_pm = "PM";
                    }
                    if (hours == 0) {
                        hours = 12;
                    }

                    var formattedTime = hours + ':' + minutes.substr(-2) + " " + am_pm;
                    $scope.correctUsers.push({
                        user: new Array(users[i]),
                        formattedTime: formattedTime,
                        formmatedDay: formmatedDay,
                        unix_time: users[i]["today_song"][0]["unix_time"] * 1000
                    })

                } else {

                }
            } // end of for loop


        //Sort Correct Users by Unix Time
        $scope.correctUsers.sort(function(a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.unix_time) - new Date(a.unix_time);
        });

        $scope.users = $scope.correctUsers;

        $scope.trackarray = [];

        for (var i = 0; i < $scope.correctUsers.length; i++) {
            $scope.trackarray.push(new Array($scope.correctUsers[i]["user"][0]["today_song"][0]["track_id"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_album_pic"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_title"], $scope.correctUsers[i]["user"][0]["today_song"][0]["song_duration"]));
        }
		
			$scope.song_count = ($scope.song_count) % $scope.trackarray.length;
			musicStatus.setStatus($scope.song_count, 0, false);
			globalPlayer.seek(0); //Do this before startStream
			$scope.startStream($scope.song_count, 0);
    });
	}
	
    //Starts the player on Page Load
    $scope.autoStart = function() {
        //Load important data from cookies + server
        songData = $scope.loadSongDataFromCookies();
        startSpecific = $scope.routeFromAnotherPage();
        $scope.loadUsers();
        musicStatus.setPage($location.path());

        //Check if we routed from another page. If so play from where we left off
        if (startSpecific == true) {
            return;
        }

        var songNum = songData[0];
        var songPos = songData[1];
        var songPaused = songData[2];
        paused = songPaused;
		
		//Start at 0 - if someone pushed a new song - We'll improve our newsfeed algorithm later
		if ($cookies.get('firstSong') != null && $cookies.get('firstSong') != $scope.trackarray[0]){
			//If we aren't in the middle of a song, reset
			if (window.globalPlayer == null || window.globalPlayer._isPlaying == false){
				songNum = 0;
			}
		}
		
		//Store our first song inside the cookie to help the check above.
		$cookies.put('firstSong', $scope.trackarray[0], {
            expires: $scope.cookieExpirationDate()
        });
		
		if ($scope.trackarray.length > 0){
			$scope.song_count = songNum % $scope.trackarray.length;
			if (songPaused == "true") {
				var pauseButton = document.getElementById('pauseButton');
				pauseButton.innerHTML = "<h4>Play</h4>";
				
				artworkUrl = $scope.trackarray[$scope.song_count % $scope.trackarray.length][1];
				myTitle =  $scope.trackarray[$scope.song_count % $scope.trackarray.length][2];
				songDuration = parseInt($scope.trackarray[$scope.song_count % $scope.trackarray.length][3]);
				userDisplay = ($scope.correctUsers[$scope.song_count]["user"][0]["nickname"] != null) ? $scope.correctUsers[$scope.song_count]["user"][0]["nickname"] : $scope.correctUsers[$scope.song_count]["user"][0]["given_name"];
			
                //Updates the current state of the player footer GUI
				if (window.globalPlayer != null){
					$scope.updateCurrentPlayerGraphics(songDuration);
				}
				
				$scope.setGraphics(userDisplay,artworkUrl,myTitle,songDuration);
				
				$scope.startStream($scope.song_count, -2000);
			} else {
				$scope.startStream($scope.song_count, songPos);
			}
		}
    }

    $scope.users;

    



}); //end of controller