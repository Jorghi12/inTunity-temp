angular.module('inTunity.profile', [
    'auth0'
])


.controller('ProfileCtrl', function ProfileController($scope, auth, $http, $location, store, $routeParams, musicStatus) {


    $scope.auth = auth;

    var prof = (store.get('profile'));
    var count_todaysongs = 0;
 

    $scope.numPosts;
    $scope.owner;
    if (prof["given_name"] != null) {
        $scope.owner = prof["given_name"];
    } else {
        $scope.owner = prof["nickname"];
    }
    var id = prof["identities"][0]["user_id"];
    $scope.user_id = id;

  

    $scope.logout = function() {
        window.logout();
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

  


    $http({
        url: 'http://localhost:3001/secured/account',
        method: 'GET'
    }).then(function(response) {
        var users = response["data"]["songs"];
		
        $scope.correctPerson = [];
        for (var i = 0; i < users.length; i++) {
            if (users[i]["url_username"] == $routeParams.itemId) {
                $scope.correctPerson.push(users[i]);
            }
            if (users[i]["today_song"].length > 0) {
                count_todaysongs++;
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
		
		$scope.my_profile_songs = [];
		
		for (var i = 0; i < $scope.correctPerson[0].song_history.length; i++){
    		$http({
    		 url: 'http://localhost:3001/secured/song/id',
    		 params: {song_id: $scope.correctPerson[0].song_history[i]},
    		 method: 'GET'
    		}).then(function(responseSong) {
    			responseSong = responseSong["data"]["user"];
    			var date = new Date(responseSong["unix_time"] * 1000);
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
    			$scope.my_profile_songs.push({
    				track_id: responseSong["track_id"],
    				song_album_pic: responseSong["song_album_pic"],
    				song_title: responseSong["song_title"],
    				song_duration: responseSong["song_duration"],
                    _id: responseSong["_id"]
    			});
    		});
		}
		
		
		
		
		
		
		
		
		
		
		
		
		
        $http({
            url: 'http://localhost:3001/secured/account/id',
            method: 'GET',
            params: {
                id: id
            }
        }).then(function(response) {

            console.log(response);

            var ownpersonalusername = response["data"]["user"]["url_username"];
            var username_clicked = store.get('username_clicked');

           
            if (username_clicked == ownpersonalusername) {
                var deleteButton = document.getElementsByClassName("delete");

                console.log(deleteButton);
                $(deleteButton).append("X");
                $(deleteButton).click(function() {
                  var item = this.getAttribute('value');
                  var obj = JSON.parse(item);
                  $scope.deleteSong($scope.user_id,obj["_id"], obj["track_id"]);

                 
                });                  
            }

            if (username_clicked != ownpersonalusername) {
                document.getElementById("selected-link").id = "";
            }
        }); // end of http get




        $scope.startStreamingProfileSong = function(songUrl, artworkUrl, myTitle, trackid, duration) {
            window.startStreamCustom(songUrl, artworkUrl, myTitle, trackid, duration, $scope.owner,"profile",false);
        }

    });








 




      // for deleting a particular song on your own account
    $scope.deleteSong = function(userid, songid, song_track_id) {

        $http({
            url: 'http://localhost:3001/secured/account/id',
            method: 'GET',
            params: {
                id: id
            }
        }).then(function(response) {
            var ownpersonalusername = response["data"]["user"]["url_username"];
            var username_clicked = store.get('username_clicked');

            if (username_clicked == ownpersonalusername) {
                console.log("about to delete...");
                $http.delete('http://localhost:3001/secured/account/id/song/id', {
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json'
                    },
                    params: {
                        user_id: userid,
                        song_id: songid
                    }
                }).success(function(data, status, headers, config) {
                    store.set('username_clicked', ownpersonalusername);

                    // UPDATE CONTENT WITHOUT ACTUALY REFRESHING PAGE
					//Doesn't need another http request. Since we KNOW which song we are deleting.
					//Just delete the correct one.
					for (var i =0;i<$scope.correctPerson[0]["song_history"].length;i++){
						if ($scope.correctPerson[0]["song_history"][i]._id == songid){
							$scope.correctPerson[0]["song_history"].splice(i,1);

                             $scope.numPosts = $scope.correctPerson[0]["song_history"].length;

							
							//Do this in order to delete the first occurance (in case the id hashing fails - not likely)
							i = $scope.correctPerson[0]["song_history"].length;
						}
					}


                    
						

					//Check if the deleted song is currently playing, if so tell the player to go to the next HomePage Song.
					if (window.globalPlayer._isPlaying){
						window.nextSong(song_track_id);
					}
					
                    $location.path("/profile/" + ownpersonalusername);
                      // window.location.reload();
                  }).error(function(data, status, headers, config) {
                    console.log(status);
                  });
              }
          }); // end of http get
    }




});