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
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
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



	$scope.loadSongsOnProfile = function(historyORfav){
		//historyORfav .. history = 0, favorite = 1
	$http({
		url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
		method: 'GET',
		params: {
			id: id
		}
	}).then(function(responseA) {
		$scope.correctPerson = responseA["data"]["user"];
        $scope.numPosts = $scope.correctPerson.song_history.length;
	
        for (var i = 0; i < $scope.correctPerson.song_history.length; i++) {
            var date = new Date($scope.correctPerson.song_history[i]["unix_time"] * 1000);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
            var formmatedDay = monthNames[month] + " " + day + ", " + year;

            $scope.correctPerson.song_history[i].formmatedDay = formmatedDay;
        }
		
		$scope.my_profile_songs = [];
		var songCollectionArray = ((historyORfav == 0) ? $scope.correctPerson.song_history : $scope.correctPerson.favorited_songs);
		for (var i = 0; i < songCollectionArray.length; i++){
    		$http({
    		 url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/song/id',
    		 params: {song_id: songCollectionArray[i]},
    		 method: 'GET'
    		}).then(function(responseSong) {
    			responseSong = responseSong["data"]["user"];

                console.log(responseSong);
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
                    _id: responseSong["_id"],
                    formmatedDay: formmatedDay,
					unix_time: responseSong["unix_time"],
                    likes:responseSong["likes"]
    			});
				
				$scope.my_profile_songs.sort(function(a, b) {
					// Turn your strings into dates, and then subtract them
					// to get a value that is either negative, positive, or zero.
					return new Date(b.unix_time) - new Date(a.unix_time);
				});
				
			if ($scope.my_profile_songs.length == songCollectionArray.length){
			   $http({
				url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
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
						$(deleteButton).append("<img src='../../images/close.png'>");
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
			}
             
    		});

            
		}
		
		
        $scope.startStreamingProfileSong = function(songUrl, artworkUrl, myTitle, trackid, duration) {
            window.startStreamCustom(songUrl, artworkUrl, myTitle, trackid, duration, $scope.owner,"profile",false);
        }

    });
	}

	
    $scope.getFavorited = function() {
        document.getElementById("history").className = "";
        document.getElementById("favorites").className = "active";

        //document.getElementById("contentsongs").innerHTML = "";

        $scope.loadSongsOnProfile(1);
         
    }

    $scope.getHistory = function() {
        document.getElementById("history").className = "active";
        document.getElementById("favorites").className = "";

        //document.getElementById("contentsongs").innerHTML = "";

        $scope.loadSongsOnProfile(0);
    }
	
    $scope.loadSongsOnProfile(0);







 




      // for deleting a particular song on your own account
    $scope.deleteSong = function(userid, songid, song_track_id) {

        $http({
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
            method: 'GET',
            params: {
                id: id
            }
        }).then(function(response) {
            var ownpersonalusername = response["data"]["user"]["url_username"];
            var username_clicked = store.get('username_clicked');

            if (username_clicked == ownpersonalusername) {
                console.log("about to delete...");
                $http.delete('http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id/song/id', {
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

					

					for (var i =0;i<$scope.correctPerson["song_history"].length;i++){
						if ($scope.correctPerson["song_history"][i] == songid){
							songHtmlObj = document.getElementById($scope.correctPerson["song_history"][i]);
							console.log("SWAG");
							console.log(songHtmlObj);
							$(songHtmlObj).remove();
							
                            $scope.numPosts = $scope.correctPerson["song_history"].length;

							$scope.correctPerson["song_history"].splice(i,1);
							
							//Do this in order to delete the first occurance (in case the id hashing fails - not likely)
							i = $scope.correctPerson["song_history"].length;
							
							//Update Number of Posts
							var postObj = document.getElementById("numPostsObject");
							var ind1 = postObj.innerHTML.indexOf(" posts");
							
							var val = postObj.innerHTML.substring(0,ind1);
							postObj.innerHTML = (val - 1) + " posts";
						}
					}



					//Check if the deleted song is currently playing, if so tell the player to go to the next HomePage Song.
					//if (window.globalPlayer._isPlaying){
						//window.nextPlayer();
						window.updateProfileSong();//song_track_id);
					//}
					
                      // window.location.reload();
                  }).error(function(data, status, headers, config) {
                    console.log(status);
                  });
              }
          }); // end of http get
    }




});