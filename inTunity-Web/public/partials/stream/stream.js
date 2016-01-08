app = angular.module('inTunity.stream', [
    'auth0', 'ngCookies'
]);

app.controller('StreamCtrl', function StreamController($scope, auth, $http, $location, store, $compile, musicStatus, $cookies, $rootScope) {
	SC.initialize({
		client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
	});

	//Load player Paused state
	var paused = (musicStatus.getStatus()[2] != null) ? musicStatus.getStatus()[2] : false;
	var song_count = 0;
	
    //Loads the current player state (song number, song position, song pause state) from the user cookies.
    $scope.loadSongDataFromCookies = function() {
        var songNum = ($cookies.get('songNum') != null) ? $cookies.get('songNum') : 0;
        var songPos = ($cookies.get('songPos') != null) ? $cookies.get('songPos') : -1;
        var songPaused = ($cookies.get('songPaused') != null) ? $cookies.get('songPaused') : false;
		
        //Update the music status via cookie data
        musicStatus.setStatus(songNum, songPos, songPaused);
		
		return [songNum,songPos,songPaused];
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
        $cookies.put('songNum', curStats[0], {
            expires: $scope.cookieExpirationDate()
        });
        $cookies.put('songPos', curStats[1], {
            expires: $scope.cookieExpirationDate()
        });
		$cookies.put('songPaused', paused, {
            expires: $scope.cookieExpirationDate()
        });
    }


    //Updates cookie data if Angular detects movement to another page (within Intunity).
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        $cookies.put('routeChange', true, {
            expires: $scope.cookieExpirationDate()
        });
        $scope.updateCookieData();
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

        console.log(prof);

        //Sets user display name
        if (prof["given_name"] != null) {
            $scope.owner = prof["given_name"];
        } else {
            $scope.owner = prof["nickname"];
        }
    }

    //Navigates to another profile
    $scope.otherprofiles = function(username) {
        store.set('username_clicked', username);
        $location.path("/profile/" + username);
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
        window.globalPlayer.pause();
    }
	
	//Allow all pages to access logout
	window.logout = $scope.logout;

    //Load profile information (when user clicks on someone's profile image)
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
        $location.path('/add-song');
    }

    //Navigate to about page
    $scope.about = function() {
        $location.path('/about');
    }

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
    $scope.setGraphics = function() {
        songDuration = parseInt($scope.trackarray[song_count % $scope.trackarray.length][3]);
        currentuser = document.getElementById("currentuser");
		
        currentuser.innerHTML = ($scope.correctUsers[song_count]["user"][0]["nickname"] != null) ? $scope.correctUsers[song_count]["user"][0]["nickname"] : $scope.correctUsers[song_count]["user"][0]["given_name"];
        var album = document.getElementById("artwork");
        album.src = $scope.trackarray[song_count % $scope.trackarray.length][1];
        var title = document.getElementById("songtitle");
        title.innerHTML = $scope.trackarray[song_count % $scope.trackarray.length][2];
        var endTime = document.getElementById("endTime");
        songDuration = parseInt($scope.trackarray[song_count % $scope.trackarray.length][3]);
        endTime.innerHTML = $scope.millisToMinutesAndSeconds(songDuration);
		
		$scope.changeBack();
    }

    //Apply the Color-Thief background transformation
    $scope.changeBack = function() {
        // this is used to change the background for player using color-thief
        var image = document.createElement("img");
        image.crossOrigin = "Anonymous";
        image.src = $scope.trackarray[song_count % $scope.trackarray.length][1];
        image.onload = function() {
            var colorThief = new ColorThief();
            var cp = colorThief.getPalette(image, 2, 5);
            // var color = colorThief.getColor(image); 
            document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb(' + cp[2][0] + ',' + cp[2][1] + ',' + cp[2][2] + '))';
        };
    }

    //Updates the graphics of the player GUI
    $scope.updateCurrentPlayerGraphics = function() {
        globalPlayer = window.globalPlayer;

        songDuration = parseInt($scope.trackarray[song_count % $scope.trackarray.length][3]);
        var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
        var progressBall = document.getElementById('playHead');
		progressBall.style.width = percent + "px";
        var currentTime = document.getElementById("currentTime");
        currentTime.innerHTML = $scope.millisToMinutesAndSeconds(globalPlayer.currentTime());
    }

	
	// when you press on album pic, it will play that song
	$scope.playSpecificSong = function(index) {
		//If we're already on that song, just toggle. --- Design Update
		if (song_count == index){
			$scope.pause();
			return;
		}
		
		song_count = index;
		new_song = $scope.trackarray[song_count % $scope.trackarray.length][0];
		var new_url = '/tracks/' + new_song;
		$scope.startStream(new_url, 0);
	}
	
	// this is for skipping to the previous song
	$scope.prevPlayer = function() {
		if (song_count == 0){
			song_count = $scope.trackarray.length;
		}
		
		song_count = (song_count - 1) % $scope.trackarray.length;
		
		paused = false;
		var pauseButton = document.getElementById('pauseButton');
		pauseButton.innerHTML = "<h4>Pause</h4>";

		new_song = $scope.trackarray[song_count % $scope.trackarray.length][0];

		new_url = '/tracks/' + new_song;
		$scope.startStream(new_url, 0);
	}

	// this is for skipping to the next song
	$scope.nextPlayer = function() {
		song_count = (song_count + 1) % $scope.trackarray.length;

		paused = false;
		var pauseButton = document.getElementById('pauseButton');
		pauseButton.innerHTML = "<h4>Pause</h4>";

		new_song = $scope.trackarray[song_count % $scope.trackarray.length][0];
		new_url = '/tracks/' + new_song;
		$scope.startStream(new_url, 0);
	}


	//Toggle (play/pause) the current song
	$scope.pause = function() { 
		var pauseButton = document.getElementById('pauseButton');
		if (paused == false) {
			window.globalPlayer.pause();
			paused = true;
			pauseButton.innerHTML = "<h4>Play</h4>";
		} else {
			window.globalPlayer.play();
			paused = false;
			pauseButton.innerHTML = "<h4>Pause</h4>";
		}
		
        //Update the music status via cookie data
        musicStatus.setStatus(song_count % $scope.trackarray.length, globalPlayer.currentTime(), paused);
		
		$cookies.put('songPaused', paused, {
            expires: $scope.cookieExpirationDate()
        });

	}
		
    //Start the SoundCloud Stream!
    $scope.startStream = function(newSoundUrl, startingPosition) {
        $scope.setGraphics();
		
        SC.stream(newSoundUrl).then(function(player) {
            globalPlayer = player
            window.globalPlayer = player;

			window.globalPlayer.play();

            globalPlayer.seek(startingPosition);

            //Add on Play-Start event code
            globalPlayer.on('play-start', function() {
                //Whether we should start specific or not
                if ($scope.startSpecific == false) {
                    globalPlayer.seek(startingPosition);
                } else {
                    songDuration = parseInt($scope.trackarray[song_count % $scope.trackarray.length][3]);
                }


                //If we are on the Home Page
                if ($location.path() == "/") {
                    //this is for resetting all the background color to its natural settings
                    for (var i = 0; i < $scope.trackarray.length; i++) {
                        var row = document.getElementById("song" + i);
                        row.style.backgroundColor = "#f5f5f5";
                    }

                    // this targets which row to highlight
                    var rowCurrent = document.getElementById("song" + song_count);
                    rowCurrent.style.backgroundColor = "#ffe4c4";
                    window.scroll(0, $scope.findPos(rowCurrent));

                }
            });



            //Event asynchronously runs while the song is streaming
            globalPlayer.on('time', function() {
                //Updates information about our currently playing song (shared cross page)
                if (globalPlayer.currentTime() < parseInt($scope.trackarray[song_count % $scope.trackarray.length][3])) {
                    //Set music status
                    musicStatus.setStatus(song_count % $scope.trackarray.length, globalPlayer.currentTime(), false);

                    //Update cookie data
                    $scope.updateCookieData();
                }

                //Updates the current state of the player footer GUI
                $scope.updateCurrentPlayerGraphics();

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
                var length = parseInt($scope.trackarray[song_count % $scope.trackarray.length][3]);
                if (length == globalPlayer.currentTime()) {
                    song_count = (song_count + 1) % $scope.trackarray.length;
                    musicStatus.setStatus(song_count, 0, false);
                    new_url = '/tracks/' + $scope.trackarray[song_count][0];

                    console.log(new_url);
                    globalPlayer.seek(0); //Do this before startStream
                    $scope.startStream(new_url, 0);
                }

            }); // end of finish

        });
    }

	//Starts the player on Page Load
	$scope.autoStart = function(){
        //Load important data from cookies + server
        songData = $scope.loadSongDataFromCookies();
        startSpecific = $scope.routeFromAnotherPage();
        $scope.loadUsers();
        musicStatus.setPage($location.path());
		
		//Check if we routed from another page. If so play from where we left off
		if (startSpecific == true){
			return;
		}
		
		var songNum = songData[0];
		var songPos = songData[1];
		var songPaused = songData[2];
		paused = songPaused;
		
		song_count = songNum % $scope.trackarray.length;
		new_url = '/tracks/' + $scope.trackarray[songNum][0];
		
		if (songPaused == true){
			var pauseButton = document.getElementById('pauseButton');
			pauseButton.innerHTML = "<h4>Play</h4>";
		}
		else{
			$scope.startStream(new_url, songPos);
		}
		
		$scope.setGraphics();
		
		$scope.updateCurrentPlayerGraphics();
	}
	
    $scope.users;

    //Load Track Data
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
		$scope.correctUsers.sort(function(a,b){
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
                var timelength = window.globalPlayer.streamInfo["duration"]; //parseInt(trackarray[song_count % trackarray.length][3]);
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



}); //end of controller