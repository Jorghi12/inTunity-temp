app = angular.module('inTunity.home', [
    'auth0', 
    'ngCookies'

]);

app.controller('HomeCtrl', function HomeController($scope, auth, $http, $location, store, $compile, musicStatus,$cookies, $rootScope) {
    $scope.auth = auth;
    var prof = (store.get('profile'));
    $scope.owner;
    var id = prof["identities"][0]["user_id"];
	var myUserId = prof["identities"][0]["user_id"];
    var trackarray = [];
    var username_url;
    
	window.legendX = auth;
    if (prof["given_name"] != null) {
        $scope.owner = prof["given_name"];
    } else {
        $scope.owner = prof["nickname"];
    }

    //use this function when you click on individual profile pics
    $scope.otherprofiles = function(username) {
      store.set('username_clicked', username);
      $location.path("/profile/" + username);
    }

	$scope.logout = function(){
		//Calls the logout code inside stream.js
		window.logout();
	}
	
    $scope.profile = function() {
        console.log("test");
        $http({
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
            method: 'GET',
            params: {
                id: id
            }
        }).then(function(response) {
            console.log("hit");
            username_url = response["data"]["user"]["url_username"];
            store.set('username_clicked', username_url);
            $location.path('/profile/' + username_url);
        }); // end of http get
    }

    $scope.home = function() {
        $location.path('/');
    }

    $scope.addSong = function() {
        $location.path('/add-song');
    }

 

    //when you like a song
    $scope.likes = function(song_id, index) {
        var likes = JSON.stringify({
            posted_user_id: myUserId, 
            song_id: song_id, 
            liked_user_id: id
        });
        $http.post('http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id/likes/song/id', {data: likes}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {
                var likes = document.getElementById("like" + index);
                likes.innerHTML = data["likes"];
            })
		.error(function(data, status, headers, config) {
            console.log(status);
        });
       
    }
	
	//Function to add a friend
	//Haven't tested - not complete
    $scope.addFollower = function(follower_user_id) {
        var followerData = JSON.stringify({
			user_id: myUserId,
            other_id: follower_user_id
        });
        $http.post('http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id/addfollower', {data: followerData}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {
                ;
            })
		.error(function(data, status, headers, config) {
            ;
        });
       
    }
	
	$scope.findMutualFriends = function(){
		
	}

});