angular.module( 'inTunity.home', [
'auth0'
])


.controller( 'HomeCtrl',  function HomeController( $scope, auth, $http, $location, store, $compile) {

  $scope.auth = auth;
  $scope.tgState = false;
  var prof = (store.get('profile'));
  $scope.owner;
  
  //Global Variables for the iframe and widget
  // var iframe = document.getElementById("sc-widget");
  //var widget = SC.Widget(iframe);
  var globalPlayer;
  /*global SC*/
  



  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }
  var id = prof["identities"][0]["user_id"];

  $scope.logout = function() {
    globalPlayer.pause();
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');

  }

  $scope.home = function() {
    $location.path('/');
  }

  $scope.addSong = function() {
    globalPlayer.pause();
    $location.path('/add-song');
  }

  $scope.about = function() {
    $location.path('/about');
  }

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }



  var username;
  var profilepic;
  var songPic;
  var songtitle;
  var songUrl;

  var timeStamp;
  var dayStamp;

  $scope.users;

  $http({
    url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    songdata = (response["data"]["songs"]);



    var song_array = [];

    var users = response["data"]["songs"];

    // this array has users who only have songs with it
    var correctUsers= [];
  
    // makes sure we only show users who have songs
    for (var i = 0; i < users.length; i++) {
      if (users[i]["today_song"]["song_url"] != "") {

        var date = new Date(users[i]["today_song"]["unix_time"] * 1000);

        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

        var formmatedDay = monthNames[month] + " " + day + ", " + year;

        var hours = date.getHours();

        var minutes = "0" + date.getMinutes();
        var am_pm = "AM";

        if (hours > 12) {
          hours = hours - 12;
          am_pm = "PM";
        }
        if (hours == 0) {
          hours = 12;
        }


        var formattedTime = hours + ':' + minutes.substr(-2) +  " " + am_pm;
        correctUsers.push(new Array(users[i], formattedTime, formmatedDay));
      } else {
        console.log("user does not have a song for today");
      }
    }

    $scope.users = correctUsers;

    console.log(correctUsers);

  
    // adding all the songs to arr
    for (var i = 0; i < correctUsers.length; i++) {
      songUrl = correctUsers[i][0]["today_song"]["song_url"];
      var entry = {
        url: songUrl
      }
      song_array.push(entry);
    }


    var trackarray = [];
    for (var i = 0; i < correctUsers.length; i++) {
      trackarray.push(new Array(correctUsers[i][0]["today_song"]["track_id"], correctUsers[i][0]["today_song"]["song_album_pic"], correctUsers[i][0]["today_song"]["song_title"], correctUsers[i][0]["today_song"]["song_duration"]));
    }

    console.log("track array:");
    console.log(trackarray);




    SC.initialize({
        client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
    });



    var paused = false;
    var song_count = 0;
    var song_index = 0;
        
    if (trackarray.length > 0) {
      var trackid = (trackarray[0][0]);
      var url = 'tracks/' + trackid;
      startStream(url);
    }



   
   

    // when you press on album pic, it will play that song
    $scope.playSpecificSong = function(index) {
      song_index = index;
      song_count = song_index;
      new_song = trackarray[song_count % trackarray.length][0];
      var new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    // this is for skipping to the previous song
    $scope.prevPlayer = function() {
      song_count--;
      if (song_count < 0) {
        song_count = 0;
      }

      paused = false;
      var pauseButton = document.getElementById('pauseButton');
      pauseButton.innerHTML = "Pause";

      new_song = trackarray[song_count % trackarray.length][0];
      song_index = song_count % trackarray.length;
      console.log("Starting New " + new_song);
      new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    // this is for skipping to the next song
    $scope.nextPlayer = function() {

      song_count++;
      if (song_count == trackarray.length) {
        song_count = 0;
      }

      paused = false;
      var pauseButton = document.getElementById('pauseButton');
      pauseButton.innerHTML = "Pause";

      song_index = song_count % trackarray.length;
      new_song = trackarray[song_count % trackarray.length][0];
      console.log("Starting New " + new_song);
      new_url = '/tracks/' + new_song;
      startStream(new_url);
    }


    $scope.pause = function() {
      var pauseButton = document.getElementById('pauseButton');
      if (paused == false) {
        globalPlayer.pause();
        paused = true;
        pauseButton.innerHTML = "Play";
      } else {
        globalPlayer.play();
        paused = false;
        pauseButton.innerHTML = "Pause";
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

   
    // console.log(SC.resolve("https://soundcloud.com/octobersveryown/remyboyz-my-way-rmx-ft-drake"));

    var time = document.getElementById("time");


    var progressBall = document.getElementById('playHead');
    var time = document.getElementById('time');
    var songDuration = 0;
    
    function startStream(newSoundUrl) {
      songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
      
      SC.stream(newSoundUrl).then(function (player) {

        globalPlayer = player;
        globalPlayer.play();
        globalPlayer.seek(0);

        globalPlayer.on('play-start', function () {
          console.log("play");
          globalPlayer.seek(0);



          var endTime = document.getElementById("endTime");
          endTime.innerHTML = millisToMinutesAndSeconds(songDuration);

          //this is for resetting all the background color to its natural settings
          for (var i = 0; i < trackarray.length; i ++) {
             var row = document.getElementById("song" + i);
             row.style.backgroundColor = "#f5f5f5";
          }

          // this targets which row to highlight
          var rowCurrent = document.getElementById("song"+song_index);
          rowCurrent.style.backgroundColor = "#ffe4c4";
          window.scroll(0,findPos(rowCurrent));

          var album = document.getElementById("artwork");
          album.src = trackarray[song_count % trackarray.length][1];

          var title = document.getElementById("songtitle");
          title.innerHTML = trackarray[song_count % trackarray.length][2];
        }); 



        globalPlayer.on('time', function() {

          songDuration = parseInt(trackarray[song_count % trackarray.length][3]);

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
          var length = parseInt(trackarray[song_count % trackarray.length][3]);
          if (length == globalPlayer.currentTime()) {
            song_count++;
            new_song = trackarray[song_count % trackarray.length][0];
            song_index = song_count % trackarray.length;
            new_url = '/tracks/' + new_song;
            console.log(new_url);
            globalPlayer.seek(0); //Do this before startStream
            startStream(new_url);
          }
  
        }); // end of finish







      });
    }


   
    

    

    //Handles the progress bar.



    var playHead = document.getElementById('playHead');
    var timelineWidth = time.offsetWidth - playHead.offsetWidth;
        
    time.addEventListener('click', function (event) {
      changePosition(event);
    }, false);
    
   
    function changePosition(click) {
      var timelength = parseInt(trackarray[song_count % trackarray.length][3]);
      console.log(timelength);


      var col1 = document.getElementById("col1");

      console.log(click.pageX);

      var marginLeft;
      if (col1.offsetWidth < 500) {
        console.log("here");
        marginLeft = click.pageX - 15;
      } else {
        marginLeft = click.pageX - col1.offsetWidth - 10
      }
      


      var percentageClicked = (marginLeft / time.offsetWidth);


      console.log(percentageClicked);
      globalPlayer.seek(Math.floor(percentageClicked * timelength));
      var currentTime = percentageClicked * timelength;
      progressBall.style.width = ((currentTime/ timelength) * time.offsetWidth) + "px";



    }

  }); // end of http get



});

