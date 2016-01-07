app = angular.module('inTunity.home', [
    'auth0', 
    'ngCookies'

]);

app.controller('HomeCtrl', function HomeController($scope, auth, $http, $location, store, $compile, musicStatus,$cookies, $rootScope) {
    var songNum;
    var songPos;
    if ($cookies.get('songNum') != null) {
        songNum = $cookies.get('songNum'); //Swag
    } else {
        songNum = 0;
    }


    if ($cookies.get('songPos') != null) {
        songPos = $cookies.get('songPos');
    } else {
        songPos = -1;
    }

    var startSpecific;
    if ($cookies.get('routeChange') != null) {
        startSpecific = $cookies.get('routeChange');
    } else {
        startSpecific = true;
    }

    $cookies.put('routeChange', false);
    musicStatus.setStatus(songNum, songPos);

  

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        curStats = musicStatus.getStatus();
        $cookies.put('songNum', curStats[0], {expires: expirationDate});
        $cookies.put('songPos', curStats[1], {expires: expirationDate});
        $cookies.put('routeChange', true, {expires: expirationDate});
    });

  
    $scope.auth = auth;
    var prof = (store.get('profile'));
    $scope.owner;
    var id = prof["identities"][0]["user_id"];
    var globalPlayer;
    var trackarray = [];
    var username_url;
    var songUrl;

  	var expirationDate = new Date();
  	var numberOfDaysToAdd = 10;
  	expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd); 
  	

    if (prof["given_name"] != null) {
        $scope.owner = prof["given_name"];
    } else {
        $scope.owner = prof["nickname"];
    }

    //use this function when you click on individual profile pics
    $scope.otherprofiles = function(username) {
      store.set('username_clicked', username);
      $location.path("/profile/" + username);
    }


    $scope.logout = function() {
        if (trackarray.length > 0) {
            window.globalPlayer.pause();
        }
        auth.signout();
        store.remove('profile');
        store.remove('token');
        $location.path('/login');
    }

    $scope.profile = function() {
        $http({
            url: 'http://localhost:3001/secured/account/id',
            method: 'GET',
            params: {
                id: id
            }
        }).then(function(response) {
            username_url = response["data"]["user"]["url_username"];
            store.set('username_clicked', username_url);
            $location.path('/profile/' + username_url);
        }); // end of http get
    }

    $scope.home = function() {
        $location.path('/');
    }

    $scope.addSong = function() {
        $location.path('/add-song');
    }



    function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }




    $scope.users;

    $http({
        url: 'http://localhost:3001/secured/account',
        method: 'GET'
    }).then(function(response) {
        var users = response["data"]["songs"];
     
        // this array has users who only have songs for today with it
        var correctUsers = [];

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
                correctUsers.push({
                    user:  new Array(users[i]), 
                    formattedTime: formattedTime,
                    formmatedDay: formmatedDay,
                    unix_time:  users[i]["today_song"][0]["unix_time"] * 1000   
                })
    
            } else {
               
            }
        } // end of for loop

        $scope.users = correctUsers;

        console.log(correctUsers);



        for (var i = 0; i < correctUsers.length; i++) {
            trackarray.push(new Array(correctUsers[i]["user"][0]["today_song"][0]["track_id"], correctUsers[i]["user"][0]["today_song"][0]["song_album_pic"], correctUsers[i]["user"][0]["today_song"][0]["song_title"], correctUsers[i]["user"][0]["today_song"][0]["song_duration"]));
        }



        SC.initialize({
            client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
        });




        var paused = false;
        var song_count = 0;

       

      
        if (trackarray.length > 0) {
            var trackid = (trackarray[0][0]);
            var url = 'tracks/' + trackid;


            statusObj = musicStatus.getStatus();
            if (musicStatus.checkConfirm()) {
                statusObj = [0, -1];
            }
            songUrl = 'tracks/' + trackarray[statusObj[0] % trackarray.length][0];
            songPos = statusObj[1];

            //We haven't started playing music yet
            if (songPos == -1 || songPos == null) {
                startStream(songUrl, -1);
            } else {
                song_count = statusObj[0];
                if (startSpecific == true || startSpecific == null) {
                    startStream(songUrl, -1);
                } else {
                    startStream(songUrl, songPos);
                }
            }
        }


        // goes to the correct position in the screen when songs changes
        function findPos(obj) {
            var curtop = 0;
            if (obj.offsetParent) {
                do {
                    curtop += obj.offsetTop - 50;
                } while (obj = obj.offsetParent);
                return [curtop];
            }
        }


        var time = document.getElementById("time");
        var progressBall = document.getElementById('playHead');
        var time = document.getElementById('time');
        var songDuration = 0;


        function startStream(newSoundUrl, startingPosition) {
			return;
            songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
            currentuser = document.getElementById("currentuser");


            currentuser.innerHTML = correctUsers[song_count]["user"][0]["nickname"];



            SC.stream(newSoundUrl).then(function(player) {
                globalPlayer = player;
				window.globalPlayer = player;
				if (startingPosition != -2000) {
					window.globalPlayer.play();
				} else {
					$scope.pause();
				}

               
				
                var album = document.getElementById("artwork");
                album.src = trackarray[song_count % trackarray.length][1];


                // this is used to change the background for player using color-thief
                var image = document.createElement("img");
                image.crossOrigin = "Anonymous";
                image.src = trackarray[song_count % trackarray.length][1];
                image.onload = function(){
                    var colorThief = new ColorThief();
                    var cp = colorThief.getPalette(image, 2, 5);
                    document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb('+cp[2][0]+','+cp[2][1]+','+cp[2][2]+'))';
                };
               

                var title = document.getElementById("songtitle");
                title.innerHTML = trackarray[song_count % trackarray.length][2];

                globalPlayer.seek(startingPosition);

			    globalPlayer.on('play-start', function() {
					if (startSpecific == false){
                        globalPlayer.seek(startingPosition);
                    } else {
                        var endTime = document.getElementById("endTime");
                        songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
                        endTime.innerHTML = millisToMinutesAndSeconds(songDuration);
                    }
                    var endTime = document.getElementById("endTime");
                    endTime.innerHTML = millisToMinutesAndSeconds(songDuration);

                   



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



                globalPlayer.on('time', function() {



                    //Updates information about our currently playing song (shared cross page)
                    if (globalPlayer.currentTime() < parseInt(trackarray[song_count % trackarray.length][3])) {
                        musicStatus.setStatus(song_count % trackarray.length, globalPlayer.currentTime());
                        $cookies.put('songNum', song_count % trackarray.length, {expires: expirationDate});
                        $cookies.put('songPos', globalPlayer.currentTime(), {expires: expirationDate});
                    }
					
					if (globalPlayer.currentTime() < startingPosition){
              
                    }
					
                    songDuration = parseInt(trackarray[song_count % trackarray.length][3]);

                    var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
                    progressBall.style.width = percent + "px";

                    var currentTime = document.getElementById("currentTime");
                    currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());
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
                        globalPlayer.seek(0)
                        startStream(new_url, 0);
                    }

                }); // end of finish

            });
        }








    }); // end of http get



});