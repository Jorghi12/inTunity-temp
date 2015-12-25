angular.module( 'inTunity.addSong', [
  'auth0'
])
.controller( 'AddSongCtrl', function AddSongController( $scope, auth, $location, store, $http, $compile, musicStatus) {
  $scope.auth = auth;
  $scope.tgState = false;
  $scope.search = "";

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

  var globalPlayer;
  var trackarray;
  var song_count;
  var prevTime;


  $http({
    url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/specificUser' ,
    method: 'GET',
    params: {id: id}
  }).then(function(response) {  
    var current = response["data"]["user"]["current_song"];
    console.log(current);
    if (current["track_array"].length > 0) {
      trackarray = current["track_array"];

      song_count = current["song_index"];
      prevTime = current["current_time"];
      startStreaming(current["track_id"]);

      var paused = false;


      var progressBall = document.getElementById('playHead');
      var time = document.getElementById('time');

      $scope.pause = function() {
        var pauseButton = document.getElementById('pauseButton');
        if (paused == false) {
          globalPlayer.pause();
          paused = true;
          pauseButton.innerHTML = "<h4>Play</h4>";
        } else {
          globalPlayer.play();
          paused = false;
          pauseButton.innerHTML = "<h4>Pause</h4>";
        }
      }

      // this is for skipping to the previous song
      /*$scope.prevPlayer = function() {
        song_count--;
        if (song_count < 0) {
          song_count = 0;
        }

        paused = false;
        var pauseButton = document.getElementById('pauseButton');
        pauseButton.innerHTML = "<h4>Pause</h4>";

        new_song = trackarray[song_count % trackarray.length][0];
        song_index = song_count % trackarray.length;
        console.log("Starting New " + new_song);
        new_url = '/tracks/' + new_song;
        startStreaming(new_url);
      }

      // this is for skipping to the next song
      $scope.nextPlayer = function() {

        song_count++;
        if (song_count == trackarray.length) {
          song_count = 0;
        }

        paused = false;
        var pauseButton = document.getElementById('pauseButton');
        pauseButton.innerHTML = "<h4>Pause</h4>";

        song_index = song_count % trackarray.length;
        new_song = trackarray[song_count % trackarray.length][0];
        console.log("Starting New " + new_song);
        new_url = '/tracks/' + new_song;
        startStreaming(new_url);
      }*/




      function startStreaming(newSoundUrl) {

        songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
        var endTime = document.getElementById("endTime");
        endTime.innerHTML = millisToMinutesAndSeconds(songDuration);


        console.log(trackarray[song_count]);

        var song_title = document.getElementById("songtitle");
        song_title.innerHTML = trackarray[song_count % trackarray.length][2];

        var poster = document.getElementById("currentuser");
        poster.innerHTML = trackarray[song_count][4];

        var image = document.getElementById("artwork");
        image.src = trackarray[song_count][1];

       
        
        SC.stream(newSoundUrl).then(function (player) {

          

          globalPlayer = player;
          globalPlayer.play();


    

          globalPlayer.on('seek', function () {
            console.log("seek");  
          }); 

          globalPlayer.on('play-start', function () {
            console.log(prevTime);
            globalPlayer.seek(parseFloat(prevTime));
            globalPlayer.play();      
          }); 



         



         

          globalPlayer.on('time', function() {

            songDuration = parseInt(trackarray[song_count % trackarray.length][3]);

            var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
            progressBall.style.width = percent + "px";

            var currentTime = document.getElementById("currentTime");
            currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());



          });

       

         

          globalPlayer.on('finish', function () {
            var length = parseInt(trackarray[song_count % trackarray.length][3]);
            if (length == globalPlayer.currentTime()) {
              song_count++;
              new_song = trackarray[song_count % trackarray.length][0];
              
              new_url = '/tracks/' + new_song;
              console.log(new_url);
              globalPlayer.seek(0); //Do this before startStream

              startStreaming(new_url);
            }
    
          }); // end of finish

        });
    }







      if (trackarray.length > 0) { 
        var playHead = document.getElementById('playHead');
        var timelineWidth = time.offsetWidth - playHead.offsetWidth;
            
        time.addEventListener('click', function (event) {
          changePosition(event);
        }, false);

        function changePosition(click) {
          var timelength = parseInt(trackarray[song_count % trackarray.length][3]);
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
          globalPlayer.seek(Math.floor(percentageClicked * timelength));
          var currentTime = percentageClicked * timelength;
          progressBall.style.width = ((currentTime/ timelength) * time.offsetWidth) + "px";

        }
      } 



    }
  

  }); // end of http get


 











  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.home = function() {
    $location.path('/');
  }

  $scope.profile = function() {
    var ppl = store.get('profile');
    var ppl_id = ppl["identities"][0]["user_id"];

    $http({
      url: 'http://localhost:3001/secured/specificUser' ,
      method: 'GET',
      params: {id: ppl_id}
    }).then(function(response) {  
      username_url = response["data"]["user"]["url_username"];
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


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
      console.log(position.coords.latitude);
      console.log(position.coords.longitude);
      localStorage.setItem("latitude", position.coords.latitude);
      localStorage.setItem("longitude", position.coords.longitude);

    });
  } else {
      console.log("Geolocation is not supported by this browser.");
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
     

          // console.log(tracks);

          var streamableSongs = [];
          for (var i = 0; i < tracks.length; i++) {
            if (tracks[i]["streamable"] == true) {
              streamableSongs.push(tracks[i]);
            }
          }

          console.log(streamableSongs);
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

                var playbutton = "<a href='' ng-click = 'boss(" + '"' + obj[i]['permalink_url'] + '"' + ")'><div class='intunity-button play-button'><h4>" + "Sample Song" + "</h4></div></a>";
               
                var confirmSong = document.createElement("div");
                confirmSong.innerHTML = "<h4>Confirm</h4>";




                confirmSong.onclick = function() {
                  console.log("hi");
                  console.log(this.id);
                  console.log(obj[this.id]);
                  var selectedSong = obj[this.id];
                  var id = (selectedSong["id"]);
                  $scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);

                }
                confirmSong.className = 'intunity-button play-button confirmSong';
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




  $scope.selectSong = function(url, artwork, title, trackid, duration) {
   
  

    console.log(artwork);
    if (artwork != null) {
      var index = artwork.indexOf("large");
      updatedSongPic = artwork.substring(0,index) + "t500x500.jpg";
    } else {
      updatedSongPic = "/images/no-art.png";
    } 

  
    var today = new Date();


    var latitude;
    var longitude;


    latitude = parseFloat(localStorage.getItem("latitude"));
    longitude = parseFloat(localStorage.getItem("longitude"));




    var geocoder = new google.maps.Geocoder;
    var latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {

        if (results[1]) {
          console.log("result found");
          console.log(results);

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
            city: city
          });

          console.log(song);

          console.log("adding a song...");
          $http.post('http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/songs', {data: song}, { 
            headers: {
            'Accept' : '*/*',
            'Content-Type': 'application/json'
           }
          }).success(function(data, status, headers, config) {
              console.log(status);
              $location.path('/');


          }).error(function(data, status, headers, config) {
              console.log(status);
          });


        
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }
    });
  

  } // end of selectSong()

  $scope.boss = function(url){



   


  

    SC.oEmbed(url, {
      auto_play: true,
      buying: false,
      sharing: false,
      download: false,
      show_comments: false,
      show_user: false,
      enable_api: true,
      single_active: false,
      liking:false,
      element: document.getElementById('putTheWidgetHere')
    }).then(function(embed){

  

        iframe = document.getElementsByTagName("iframe")[0];
        widget = SC.Widget(iframe); 
        widget.bind(SC.Widget.Events.FINISH, endSC);
        widget.bind(SC.Widget.Events.PLAY, playSC);
        iframe.height = 125;

    });

    function playSC(){
        var container = document.getElementById("widgetContainer");
        container.style.height = "125px";

        iframe = document.getElementsByTagName("iframe")[0];
        iframe.height = 125;
        widget = SC.Widget(iframe); 
    }

    function endSC(){
        iframe = document.getElementsByTagName("iframe")[0];
        iframe.height = 0;

        var container = document.getElementById("widgetContainer");
        container.style.height = "0px";


    }

  } // end of boss function

  


});






