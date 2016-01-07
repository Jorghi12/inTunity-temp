angular.module( 'inTunity.addSong', [
  'auth0'
])
.controller( 'AddSongCtrl', function AddSongController( $scope, auth, $location, store, $http, $compile, musicStatus, $cookies) {
  $scope.auth = auth;
  $scope.tgState = false;
  $scope.search = "";
  var globalPlayer;




  var prof = (store.get('profile'));
  $scope.owner;
  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }

  SC.initialize({ 
    client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
  });

  $scope.position;

  var id = auth.profile["identities"][0]["user_id"];

  var trackarray;
  var song_count; 
  var prevTime;

  $scope.confirmCounter = 0;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } 

  function showPosition(position) {
      localStorage.setItem("latitude", position.coords.latitude);
      localStorage.setItem("longitude", position.coords.longitude);  
      localStorage.setItem("location-error", "NO_ERROR");             
  }

  function showError(error) {
      switch(error.code) {
          case error.PERMISSION_DENIED:
              localStorage.setItem("location-error", "PERMISSION_DENIED");
              break;
          case error.POSITION_UNAVAILABLE:
              localStorage.setItem("location-error", "POSITION_UNAVAILABLE");
              break;
          case error.TIMEOUT:
               localStorage.setItem("location-error", "TIMEOUT");
              break;
          case error.UNKNOWN_ERROR:
              localStorage.setItem("location-error", "UNKNOWN_ERROR");
              break;
      }
  }








  var progressBall = document.getElementById('playHead');
  var time = document.getElementById('time');

  $scope.startStreamingAddSong = function(songUrl, artworkUrl,myTitle, trackid, duration) {

    var albumPic;
    if (artworkUrl != null) {
      var index = artworkUrl.indexOf("large");
      albumPic = artworkUrl.substring(0,index) + "t500x500.jpg";
    } else {
      albumPic = "/images/no-art.png";
    } 

     // this is used to change the background for player using color-thief
    var image = document.createElement("img");
    image.crossOrigin = "Anonymous";
    image.src = albumPic;
    image.onload = function(){
        var colorThief = new ColorThief();
        var cp = colorThief.getPalette(image, 2, 5);
        document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb('+cp[2][0]+','+cp[2][1]+','+cp[2][2]+'))';
    };

    if ($scope.confirmCounter == 1) {
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
      confirmButton.onclick = function() {
        $scope.selectSong(songUrl, artworkUrl, myTitle, trackid, duration);
      }

      var confirmTitle = document.createElement("h4");
      confirmTitle.innerHTML = "Confirm";
      confirmButton.appendChild(confirmTitle);
      confirmButton.setAttribute("id", "playerConfirm");
      confirmButton.className = "playerButton";
      confirmButton.style = "margin:10px 0px; min-height:50px;";
      playerButtons.appendChild(confirmButton);

    } 

   
    songDuration = duration;

    SC.stream("/tracks/" + trackid).then(function (player) {
  		globalPlayer = player;
  		window.globalPlayer = player;
  		globalPlayer.play();

      globalPlayer.on('play-start', function () {
  		  var endTime = document.getElementById("endTime");
  		  endTime.innerHTML = millisToMinutesAndSeconds(songDuration);
  		  
  		  var album = document.getElementById("artwork");
  		  album.src = albumPic;

  		  var title = document.getElementById("songtitle");
  		  title.innerHTML = myTitle;
      }); 

      globalPlayer.on('time', function() {
        var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
        progressBall.style.width = percent + "px";
        var currentTime = document.getElementById("currentTime");
        currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());
      });

      globalPlayer.on('finish', function () {
  			globalPlayer.seek(0);

        $scope.confirmCounter--;

        document.getElementsByClassName("footer footer-sample")[0].className = "footer";


        prevButton.style.visibility = "visible";
        nextButton.style.visibility = "visible";
        poster.style.visibility = "visible";
        selectedBy.style.visibility = "visible";

        confirmButton.style.visibility = "hidden";
        $(confirmButton).remove();



  			//Need to invoke startStream on home.js somehow....
  			//-2000 is code for go back to feed songs
  			window.playSpecificSong(musicStatus.getStatus()[0], -2000);
      }); // end of finish

    });
  }


  $scope.logout = function() {
  	auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  	
  	//STOP SOUND PLAYER
  	window.globalPlayer.pause();
  }

  var paused = false;

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
  }
		
  $scope.home = function() {
    $location.path('/');
  }

  $scope.profile = function() {
    $http({
        url: 'http://localhost:3001/secured/account/id',
        method: 'GET',
        params: {
            id: id
        }
    }).then(function(response) {
        console.log(response["data"]["user"]);
        username_url = response["data"]["user"]["url_username"];
        store.set('username_clicked', username_url);
        $location.path('/profile/' + username_url);

    }); // end of http get

  }

  $scope.about = function() {
    $location.path('/about');
  }

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }


  
 

  $scope.findSong = function() {
 
     var name = $scope.search;
      var container = document.getElementById("searchResults");
      container.innerHTML = "";

      if (name == "") {
        container.innerHTML = "<h3>Please Enter a Search Query</h3>";
      } else {

        //searching for specific genres / artists
        var page_size = 100;
        SC.get('/tracks', {
          q: name,
          limit: page_size 
        }).then(function(tracks) {
     
          var streamableSongs = [];
          for (var i = 0; i < tracks.length; i++) {
            if (tracks[i]["streamable"] == true) {
              streamableSongs.push(tracks[i]);
            }
          }

          var obj =(streamableSongs);
          for (var i = 0; i < obj.length; i++) {

            var albumArtwork;
            if(obj[i]['artwork_url'] != null) {
                var album = obj[i]['artwork_url'];
                var index = album.indexOf("large");
                albumArtwork = album.substring(0,index) + "t500x500.jpg";
            } else {
               albumArtwork = "/images/no-art.png";
            }

            var songContainer = document.createElement('div');
            songContainer.className = "col-md-6 search-result";

              var col1 = document.createElement('div');
              col1.className = "col-md-6";


                var img = document.createElement('img');
                img.className = "album-artwork";
                img.src = albumArtwork;

              col1.appendChild(img);

              var col2 = document.createElement('div');
              col2.className = "col-md-6 search-info";


                var songTitle = document.createElement('h4');
                songTitle.innerHTML = obj[i]["title"];

                var likes = document.createElement('h5');
                likes.innerHTML = "Soundcloud likes: " + obj[i]["likes_count"];

                var duration = document.createElement("h5");
                duration.innerHTML = "Time: " + millisToMinutesAndSeconds(obj[i]["duration"]);

        				var playbutton = document.createElement("a");
        				playbutton.href = "";
        				playbutton.innerHTML = "<div class='intunity-button play-button'><h4>" + "Sample Song" + "</h4></div>";

        				playbutton.onclick = function(){
                  document.getElementsByClassName("footer")[0].className = "footer footer-sample";
                  var selectedSong = obj[this.id];
                  var id = (selectedSong["id"]);

                  $scope.confirmCounter++;

                  $scope.startStreamingAddSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);

                
				        
                }
				
                var confirmSong = document.createElement("div");
                confirmSong.innerHTML = "<h4>Confirm</h4>";

                confirmSong.onclick = function() {
                  var selectedSong = obj[this.id];
                  var id = (selectedSong["id"]);
				  
                  $scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);

                }


                confirmSong.className = 'intunity-button play-button confirmSong';
                playbutton.id = i;
                confirmSong.id = i;
                
                var playElement = $compile(playbutton)($scope)[0];
      
              col2.appendChild(songTitle);
              col2.appendChild(likes); 
              col2.appendChild(duration); 
              col2.appendChild(playElement);
              col2.appendChild(confirmSong);

              songContainer.appendChild(col1);
              songContainer.appendChild(col2);

              container.appendChild(songContainer);
          }
        });
      }

    
  } // end of findSong

  

	var expirationDate = new Date();
	var numberOfDaysToAdd = 10;
	expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd); 



  $scope.selectSong = function(url, artwork, title, trackid, duration) {
   
    if (artwork != null) {
      var index = artwork.indexOf("large");
      updatedSongPic = artwork.substring(0,index) + "t500x500.jpg";
    } else {
      updatedSongPic = "/images/no-art.png";
    } 

  
    var today = new Date();
	


   



    var location_error = localStorage.getItem("location-error");
     var latitude = parseFloat(localStorage.getItem("latitude"));
      var longitude = parseFloat(localStorage.getItem("longitude"));

    if (location_error == "NO_ERROR" && localStorage.getItem("latitude") != "" && localStorage.getItem("longitude") != "") {
     
      var geocoder = new google.maps.Geocoder;
      var latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

      geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) { 
          if (results[1]) {    
            var state = results[2]["address_components"][1]["short_name"];
            var city = results[1]["address_components"][1]["short_name"];

            var song = JSON.stringify({
              user_id: id,
              song_url:url, 
              song_artwork: updatedSongPic, 
              song_title: title,
              unix_time: today.getTime()/1000,
              track_id: trackid,
              song_duration: duration,
              state: state,
              city: city,
              locationFlag: true
            });

   


            $http.post('http://localhost:3001/secured/account/id/song', {data: song}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
            }).success(function(data, status, headers, config) {
                
                musicStatus.confirmSong();
                curStats = musicStatus.getStatus();
                $cookies.put('songNum',curStats[0], {expires: expirationDate});
                $cookies.put('songPos',curStats[1], {expires: expirationDate});
                $location.path('/');


            }).error(function(data, status, headers, config) {
                console.log(status);
            });

            localStorage.removeItem("latitude");
            localStorage.removeItem("longitude");
            localStorage.removeItem("location-error");


          
          } else {
            window.alert('No results found');
          }
        } else {
          window.alert('Geocoder failed due to: ' + status);
        }
      });
    } else {
      // there is location error
       var song = JSON.stringify({
          user_id: id,
          song_url:url, 
          song_artwork: updatedSongPic, 
          song_title: title,
          unix_time: today.getTime()/1000,
          track_id: trackid,
          song_duration: duration,
          locationFlag: false
        });


        $http.post('http://localhost:3001/secured/account/id/song', {data: song}, { 
          headers: {
          'Accept' : '*/*',
          'Content-Type': 'application/json'
         }
        }).success(function(data, status, headers, config) {
            console.log(status);
            localStorage.removeItem("location-error");
            musicStatus.confirmSong();
            curStats = musicStatus.getStatus();
            $cookies.put('songNum',curStats[0], {expires: expirationDate});
            $cookies.put('songPos',curStats[1], {expires: expirationDate});
            $location.path('/');


        }).error(function(data, status, headers, config) {
            console.log(status);
        });

    } // end of else statement




   
   
  

  } // end of selectSong()
  


});





