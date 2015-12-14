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
        var obj =(tracks);
        
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

              var playbutton = "<div class='intunity-button play-button'><a href='' ng-click = 'boss(" + '"' + obj[i]['permalink_url'] + '"' + ")'><h4>" + "Sample Song" + "</h4></a></div>";
             
              var confirmSong = document.createElement("div");
              confirmSong.innerHTML = "<h4>Confirm</h4>";




              confirmSong.onclick = function() {
                console.log("hi");
                console.log(this.id);
                console.log(tracks[this.id]);
                var selectedSong = tracks[this.id];
                $scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"]);

              }
              confirmSong.className = 'intunity-button play-button confirmSong';
              confirmSong.id = i;
              


              var playElement = $compile(playbutton)($scope)[0];
    


            col2.appendChild(songTitle);
            col2.appendChild(likes);  
            col2.appendChild(playElement);
            col2.appendChild(confirmSong);

            songContainer.appendChild(col1);
            songContainer.appendChild(col2);

            container.appendChild(songContainer);
        }
      });
    }
  }




  $scope.selectSong = function(url, artwork, title) {
    console.log(url);
    console.log(artwork)
    console.log(title);

    if (artwork != "null") {
      var index = artwork.indexOf("large");
      updatedSongPic = artwork.substring(0,index) + "t500x500.jpg";
    } else {
      updatedSongPic = "/images/no-art.png";
    } 


     var today = new Date();
     var song = JSON.stringify({
        user_id: id,
        // timeStamp: time,
        // timeDay: todayday,
        song_url:url, 
        song_artwork: updatedSongPic, 
        song_title: title,
        unix_time: today.getTime()/1000});

     // console.log(song);
    
    $http.post('http://localhost:3001/secured/songs', {data: song}, { 
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
      client_id: '87be5093d25e70cbe11e0e4e6ae82ce7',
      redirect_uri: 'http://localhost:3000'
    });

   


  

    SC.oEmbed(url, {
      auto_play: true,
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







