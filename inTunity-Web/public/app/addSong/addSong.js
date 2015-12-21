angular.module( 'inTunity.addSong', [
  'auth0'
])
.controller( 'AddSongCtrl', function AddSongController( $scope, auth, $location, store, $http, $compile) {
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

  var id = auth.profile["identities"][0]["user_id"];


  




  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.home = function() {
    $location.path('/');
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

              var playbutton = "<div class='intunity-button play-button'><a href='' ng-click = 'boss(" + '"' + obj[i]['permalink_url'] + '"' + ")'><h4>" + "Sample Song" + "</h4></a></div>";
             
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
  }




  $scope.selectSong = function(url, artwork, title, trackid, duration) {
    console.log(url);
    console.log(artwork)
    console.log(title);
    console.log(trackid);
  

    console.log(artwork);
    if (artwork != null) {
      var index = artwork.indexOf("large");
      updatedSongPic = artwork.substring(0,index) + "t500x500.jpg";
    } else {
      updatedSongPic = "/images/no-art.png";
    } 


     var today = new Date();
     var song = JSON.stringify({
        user_id: id,
        song_url:url, 
        song_artwork: updatedSongPic, 
        song_title: title,
        unix_time: today.getTime()/1000,
        track_id: trackid,
        song_duration: duration
    });

    console.log(song);



    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else { 
        console.log("Geolocation is not supported by this browser.");
    }

    
    // going to do everything inside this function
    // function showPosition(position) {
    //     lat = (position.coords.latitude); 
    //     lon = (position.coords.longitude);  
       


    //     function initMap() {
    //       var map = new google.maps.Map(document.getElementById('map'), {
    //         zoom: 8,
    //         center: {lat: 40.731, lng: -73.997}
    //       });
    //       var geocoder = new google.maps.Geocoder;
    //       var infowindow = new google.maps.InfoWindow;

    //       // document.getElementById('submit').addEventListener('click', function() {
    //       //   geocodeLatLng(geocoder, map, infowindow);
    //       // });
    //     }

    // }
    









    console.log("about add a song...");  
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



  } 

  $scope.boss = function(url){

    SC.initialize({
      client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
    });

   


  

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







