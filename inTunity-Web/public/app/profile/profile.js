angular.module( 'inTunity.profile', [
  'auth0'
])


.controller( 'ProfileCtrl',  function ProfileController( $scope, auth, $http, $location, store, $routeParams, musicStatus) {


  $scope.auth = auth;
  $scope.tgState = false;

  var prof = (store.get('profile'));
  var ppl = store.get('profile');
  var ppl_id = ppl["identities"][0]["user_id"];

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
	   window.globalPlayer.pause();
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


  $scope.profile = function() {
    $http({
        url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/account/id',
        method: 'GET',
        params: {
            id: ppl_id
        }
    }).then(function(response) {
        username_url = response["data"]["user"]["url_username"];
        store.set('username_clicked', username_url);
        $location.path('/profile/' + username_url);
    }); // end of http get
  }


  $http({
        url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/account/id',
        method: 'GET',
        params: {
            id: ppl_id
        }
    }).then(function(response) {
        var personalusername = response["data"]["user"]["url_username"];

        var username_clicked = store.get('username_clicked');

        console.log(username_clicked);
        console.log(personalusername);

        if (username_clicked != personalusername) {
          document.getElementById("selected-link").id = "";
          console.log("hit");
        }




       

        


    }); // end of http get



  
  SC.initialize({
    client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
  });


  $http({
    url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    var users = response["data"]["songs"];



    $scope.correctPerson = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i]["url_username"] == $routeParams.itemId) {
        $scope.correctPerson.push(users[i]);
      }  
    }


    console.log($scope.correctPerson);


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
    var poster = document.getElementById("currentuser");
    currentuser.innerHTML = $scope.correctPerson[0].nickname;

     // this is used to change the background for player using color-thief
    var image = document.createElement("img");
    image.crossOrigin = "Anonymous";
    image.src = artworkUrl;
    image.onload = function(){
        var colorThief = new ColorThief();
        var cp = colorThief.getPalette(image, 2, 5);
        // var color = colorThief.getColor(image); 
        document.getElementById("footer1").style.background = 'linear-gradient(#f5f5f5, rgb('+cp[2][0]+','+cp[2][1]+','+cp[2][2]+'))';
    };



    songDuration = duration;
    
    SC.stream("/tracks/" + trackid).then(function (player) {
		  globalPlayer = player;
		  window.globalPlayer = player;
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
		  
          var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
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
			window.playSpecificSong(musicStatus.getStatus()[0], -2000);
        });

      });
    }




});





