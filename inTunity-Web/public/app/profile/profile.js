angular.module( 'inTunity.profile', [
  'auth0'
])


.controller( 'ProfileCtrl',  function ProfileController( $scope, auth, $http, $location, store, $routeParams, musicStatus) {


  $scope.auth = auth;
  $scope.tgState = false;

  var prof = (store.get('profile'));

  $scope.owner;
  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }
  var id = prof["identities"][0]["user_id"];


  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.home = function() {
    $location.path('/');
  }

  $scope.addSong = function() {
    $location.path('/add-song');
  }

  $scope.about = function() {
    $location.path('/about');
  }

  
  SC.initialize({
    client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
  });


  $http({
    url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    var users = response["data"]["songs"];



    $scope.correctPerson = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i]["url_username"] == $routeParams.itemId) {
        $scope.correctPerson.push(users[i]);
      }  
    }



    $scope.numPosts = $scope.correctPerson[0].song_history.length;

    for (var i = 0; i < $scope.correctPerson[0].song_history.length; i++) {
      var date = new Date($scope.correctPerson[0].song_history[i]["unix_time"] * 1000);
      var year = date.getFullYear();
      var month = date.getMonth();
      var day = date.getDate();
      var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
      var formmatedDay = monthNames[month] + " " + day + ", " + year;

      $scope.correctPerson[0].song_history[i].formmatedDay = formmatedDay;
    }





  }); // end of http get


  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds; 
  }
   
    var progressBall = document.getElementById('playHead');
    var time = document.getElementById('time');
	
  $scope.startStreamingProfileSong = function(songUrl, artworkUrl,myTitle, trackid, duration) {
      songDuration = duration;
      currentuser = "Add Song";
      currentuser.innerHTML = "Add Song";
      SC.stream("/tracks/" + trackid).then(function (player) {
		globalPlayer = player;
	    globalPlayer.seek(0);
		globalPlayer.play();
        globalPlayer.on('play-start', function () {
		  var endTime = document.getElementById("endTime");
		  endTime.innerHTML = millisToMinutesAndSeconds(songDuration);
		  
		  var album = document.getElementById("artwork");
		  album.src = artworkUrl;

		  var title = document.getElementById("songtitle");
		  title.innerHTML = myTitle;
        }); 



        globalPlayer.on('time', function() {
		  //Updates information about our currently playing song (shared cross page)
		  
          var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
		  //alert(percent);
          progressBall.style.width = percent + "px";

          var currentTime = document.getElementById("currentTime");
          currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());
		

          if (globalPlayer.currentTime() <= (songDuration  * 0.02)) {
            globalPlayer.setVolume(0.8);
          }

          if ((globalPlayer.currentTime() > (songDuration  * 0.02)) && (globalPlayer.currentTime() < (songDuration  * 0.98)) ) {
             globalPlayer.setVolume(1);
          }

          if (globalPlayer.currentTime() >= (songDuration  * 0.98)) {
            globalPlayer.setVolume(0.8);
          }

        });

       

        globalPlayer.on('finish', function () {
			globalPlayer.seek(0);
        }); // end of finish

      });
    }




});





