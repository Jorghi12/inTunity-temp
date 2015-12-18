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


  var username;
  var profilepic;
  var songPic;
  var songtitle;
  var songUrl;

  var timeStamp;
  var dayStamp;

  $scope.users;

  $http({
    url: 'http://localhost:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    songdata = (response["data"]["songs"]);

    song_count = 0;
    song_index = 0;
    window.song_array = [];

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

    console.log(correctUsers);

    $scope.users = correctUsers;

  
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
      trackarray.push(correctUsers[i][0]["today_song"]["track_id"]);
    }

    console.log(trackarray);



    SC.initialize({
        client_id: '87be5093d25e70cbe11e0e4e6ae82ce7',
        redirect_uri: 'http://localhost:3000'
    });
        

    var trackid = trackarray[0];
    var url = '/tracks/' + trackid;
    startStream(url);

    var song_count = 0;

    // this is for skipping to the previous song
    $scope.prevPlayer = function() {
      song_count--;
      if (song_count < 0) {
        song_count = trackarray.length - 1;
      }
      new_song = trackarray[song_count % trackarray.length];
      console.log("Starting New " + new_song);
      new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    // this is for skipping to the next song
    $scope.nextPlayer = function() {
      song_count++;
      new_song = trackarray[song_count % trackarray.length];
      console.log("Starting New " + new_song);
      new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    
    function startStream(newSoundUrl) {
      SC.stream(newSoundUrl).then(function (player) {
        console.log(player);
        globalPlayer = player;

        globalPlayer.play();

        globalPlayer.on('play-start', function () {
          globalPlayer.seek(0);
          globalPlayer.play();
        }); 

        
        globalPlayer.on('finish', function () {
          song_count++;
          new_song = trackarray[song_count % trackarray.length];
          console.log("Starting New " + new_song);
          new_url = '/tracks/' + new_song;
        


          startStream(new_url);
        }); 
      });
    }


    // SC.initialize({
    //   client_id: '87be5093d25e70cbe11e0e4e6ae82ce7',
    //   redirect_uri: 'http://localhost:3000'
    // });


    // // goes to the correct position in the screen when songs changes
    // function findPos(obj) {
    //     var curtop = 0;
    //     if (obj.offsetParent) {
    //         do {
    //            curtop += obj.offsetTop - 50;
    //         } while (obj = obj.offsetParent);
    //         return [curtop];
    //     }
    //  }


   

     


      // widget.bind(SC.Stream.Events.READY, function() {
      //   // load new widget
      //   widget.bind(SC.Widget.Events.FINISH, function() {
      //     widget.load(newSoundUrl, function() {
      //       iframe = document.getElementById('sc-widget');
      //       widget =  SC.Widget(iframe);
      //       widget.play();
      //       show_artwork: false;

      //     });

      //   });
      // });



    // console.log(song_array);
    // masterPlayer(song_array[0]["url"]);
    // song_count +=1;



    // $scope.playSpecificSong = function(index) {
    //   song_index = index;
    //   song_count = song_index + 1;
    //   var url = song_array[index]["url"];
    //   masterPlayer(url);
    // }







    // function masterPlayer(url){

      


    //   //  SC.oEmbed(url, {
    //   //   auto_play: true,
    //   //   buying: false,
    //   //   sharing: false,
    //   //   download: false,
    //   //   show_comments: false,
    //   //   show_user: false,
    //   //   enable_api: true,
    //   //   single_active: false,
    //   //   liking:false,
    //   //   element: document.getElementById('sc-widget')
    //   // }).then(function(embed){
    //   //     var container = document.getElementById("widgetContainer");
    //   //     iframe.src = url;
    //   //     console.log(url);
    //   //     container.style.height = "125px";
    //   //     //iframe = document.getElementsByTagName("iframe")[0];
    //   //     //widget = SC.Widget(iframe); 
    //   //     // widget.bind(SC.Widget.Events.PLAY, playSC);
    //   //     // widget.bind(SC.Widget.Events.FINISH, endSC);



    //   //     widget.bind(SC.Widget.Events.READY, function() {
    //   //       iframe = document.getElementById("sc-widget");
    //   //       iframe.height = 125;
    //   //       widget = SC.Widget(iframe); 

    //   //       //this is for resetting all the background color to its natural settings
    //   //       for (var i = 0; i < song_array.length; i ++) {
    //   //          var row = document.getElementById("song" + i);
    //   //          row.style.backgroundColor = "#f5f5f5";
    //   //       }

            
    //   //       widget.getCurrentSound(function (currentSound) {
    //   //           var rowCurrent = document.getElementById("song"+song_index);
    //   //           rowCurrent.style.backgroundColor = "#ffe4c4";
    //   //           window.scroll(0,findPos(rowCurrent));
    //   //       });

    //   //       widget.bind(SC.Widget.Events.FINISH, function() {
    //   //         new_song = song_array[song_count % song_array.length];
    //   //         song_index = song_count % song_array.length;

    //   //         song_count +=1;

    //   //         masterPlayer(new_song["url"]);
    //   //       });


          
    //   //     });


    //   // });


    // } // end of master play function

  }); // end of http get



});

