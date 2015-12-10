angular.module( 'inTunity.home', [
'auth0'
])


.controller( 'HomeCtrl',  function HomeController( $scope, auth, $http, $location, store, $compile) {

  $scope.auth = auth;
  $scope.tgState = false;

  var prof = (store.get('profile'));

  // console.log(prof);

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
    console.log(songdata);

    song_count = 0;
    song_index = 0;
    window.song_array = [];

    var users = response["data"]["songs"];

    // this array has users who only have songs with it
    var correctUsers= [];
  
    // makes sure we only show users who have songs
    for (var i = 0; i < users.length; i++) {
      if (users[i]["today_song"]["song_url"] != "") {
        console.log("user has a song for today");
        correctUsers.push(users[i]);
      } else {
        console.log("user does not have a song for today");
      }
    }

    $scope.users = correctUsers;


    // adding all the songs to arr
    for (var i = 0; i < songdata.length; i++) {
      songUrl = songdata[i]["today_song"]["song_url"];
      var entry = {
        url: songUrl
      }
      song_array.push(entry);
    }


    SC.initialize({
      client_id: '87be5093d25e70cbe11e0e4e6ae82ce7',
      redirect_uri: 'http://localhost:3000'
    });


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


    masterPlayer(song_array[0]["url"]);
    song_count +=1;



    $scope.playSpecificSong = function(index) {
      song_index = index;
      song_count = song_index + 1;
      var url = song_array[index]["url"];
      masterPlayer(url);
    }


    function masterPlayer(url){
      SC.oEmbed(url, {
        auto_play: true,
        element: document.getElementById('putTheWidgetHere')
      }).then(function(embed){
          iframe = document.getElementsByTagName("iframe")[0];
          widget = SC.Widget(iframe); 
          widget.bind(SC.Widget.Events.FINISH, endSC);
          widget.bind(SC.Widget.Events.PLAY, playSC);
      });

      function playSC(){
        iframe = document.getElementsByTagName("iframe")[0];
        iframe.height = 125;
        widget = SC.Widget(iframe); 

      	//this is for resetting all the background color to its natural settings
      	for (var i = 0; i < song_array.length; i ++) {
      	   var row = document.getElementById("song" + i);
      	   row.style.backgroundColor = "#f5f5f5";
      	}

        
        widget.getCurrentSound(function (currentSound) {
            console.log(currentSound);
            var rowCurrent = document.getElementById("song"+song_index);
            rowCurrent.style.backgroundColor = "#ffe4c4";
	          window.scroll(0,findPos(rowCurrent));
        });

      }

      function endSC(){
        new_song = song_array[song_count % song_array.length];
        song_index = song_count % song_array.length;


        song_count +=1;

        
        iframe = document.getElementsByTagName("iframe")[0];
        widget = SC.Widget(iframe); 
        widget.url= new_song;
        // console.log(widget);

        masterPlayer(new_song["url"]);
      }
    }

  }); // end of http get


});





