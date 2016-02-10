app = angular.module('inTunity.home', [
    'auth0', 
    'ngCookies'

]);

app.controller('HomeCtrl', function HomeController($scope, auth, $http, $location, store, $compile, musicStatus,$cookies, $rootScope) {
    $scope.auth = auth;
    var prof = (store.get('profile'));
    $scope.owner;
    $scope.fullname;

    $scope.suggestedFriends = auth.profile.context.mutual_friends.data;


    if (auth.profile.name.indexOf("@") == -1) {
        $scope.fullname = auth.profile.name;
    } else {
        $scope.fullname = prof["nickname"];
    }

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



    for (var i = 0; i < $scope.suggestedFriends.length; i++) {
        console.log($scope.suggestedFriends[i]);
        $http({
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id',
            method: 'GET',
            params: {
                id: 10153831455614419
            }
        }).then(function(response) {
          console.log(response);
        }); // end of http get
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

	$scope.exitModal = function(){
		//Clear children
		var container = document.getElementById("modalChildren");
		container.innerHTML = "";
		
		//Clear text area
		$scope.searchUsers = "";
	}

   
	
	//Function to pull search results for people to follow
	$scope.findUsers = function(){
		var searchText = document.getElementById("searchUsers");





		//$scope.searchUsers 
		//Need to find users that match "$scope.searchUsers"
		//Need to load them into the popup (clear popup elements first)
		//Then load profile pic + Link to Profile (Titled with name) + Checkbox (notifies whether already friends or not)
		
		

        var container = document.getElementById("modalChildren");
        
        if (searchText.value != "") {
            
        
            //Grab a list of all the users
            $http({
             url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account/id/search',
            method: 'GET',
            params: {searchString: $scope.searchUsers, userID: myUserId}
            }).then(function(response) {
                var users = response["data"]["songs"];
                
                //Clear the body
                document.getElementById("modalChildren").innerHTML = "";
                
                for (var i = 0; i < users.length; i++) {
                    //Create search results
                    var userNode = document.createElement("div");
                    userNode.className = "row";
          

                    userNode.appendChild(document.createElement("hr"));
                    
                    //Column One
                    var col1 = document.createElement('div');
                    col1.className = "col-md-6";
        
                    //Column Two
                    var col2 = document.createElement('div');
                    col2.className = "col-md-6";
                    
                    //Create Profile Image
                    var img = document.createElement('img');
                    img.className = "img-circle";
                    img.src = users[i]["picture"];
                    img.id = i;


                    $(img).click(function($this) {
                       $rootScope.$apply(function() {
                            $('#myModal').modal('hide');
                            $('.modal-backdrop').remove();
                            $location.path('/profile/' + users[$this.target.id]['url_username']);
                        });
                    });

                    
                    col1.appendChild(img);

                    //Create Profile Text
                    var userTitle = document.createElement("h4");
                    userTitle.innerHTML = users[i]["nickname"];
                    userTitle.style.fontSize = "24px";
                    
                    col2.appendChild(userTitle);
                    
                    //Append children to userNode
                    userNode.appendChild(col1);
                    userNode.appendChild(col2);

             

                   
                    
                    //Add element to container!
                    container.appendChild(userNode);
       
                    
                    
                }
            });
       } else {
        $(container).empty();
       }

		
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


    $scope.getUserInfo = function() {
        $http({
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account',
            method: 'GET'
        }).then(function(response) {
            var data = (response['data']['songs']);
            for (var i = 0; i < data.length; i++) {
                if (data[i]["user_id"] == id) {
                    $scope.profilepic = data[i]["picture"];
                    $scope.numfollowers = 10 + " Followers";
                    $scope.numfollowing = 15 + " Following";
                    var postCount = data[i]["song_history"].length;
                    if (postCount == 1) {
                        $scope.numposts =  postCount;
                        $scope.posts = "Post"
                    }
                    else {
                        $scope.numposts =  postCount;
                        $scope.posts = "Posts";
                    };
                }
            }
        });  
    }


     
    $scope.getAllLocations = function() {
        $http({
            url: 'http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/location' ,
            method: 'GET'
        }).then(function(response) {  
			//Remove Duplicates
			$scope.locs = [];
			for (var placeNum = 0; placeNum < response["data"]["location"].length; placeNum++){
				place = response["data"]["location"][placeNum];
				found = false;
				for (var obj = 0; obj < $scope.locs.length; obj++){
					if ($scope.locs[obj]["city"] == place["city"] && $scope.locs[obj]["state"] == place["state"]){
						found = true
					}
				}
				if (found == false){
					$scope.locs.push(place);
				}
			}
			
        


        }); // end of http get
    }




      $scope.getUserInfo();
      $scope.getAllLocations();



});