app = angular.module('inTunity.home', [
    'auth0', 
    'ngCookies'

]);

app.controller('HomeCtrl', function HomeController($scope, auth, $http, $location, store, $compile, musicStatus,$cookies, $rootScope, $q) {
    $scope.auth = auth;
    var prof = (store.get('profile'));
	
    $scope.owner;
    $scope.fullname;
	$scope.suggestedFriends = [];
    
	if (auth.profile.context != null){
     if(auth.profile.context.mutual_friends.length <= 0){
         $scope.suggestedFriends = auth.profile.context.mutual_friends.data;
     }else{
         $scope.suggestedFriends = [];
     }
	}
 
	//If profile name is an email, use its nickname.
    if (auth.profile.name.indexOf("@") == -1) {
        $scope.fullname = auth.profile.name;
    } else {
        $scope.fullname = prof["nickname"];
    }

	//Grab the user id
    var id = prof["identities"][0]["user_id"];
	var myUserId = prof["identities"][0]["user_id"];
    var trackarray = [];
	var username_url;
	
	$scope.myUserId = myUserId;
	$scope.followersNumber = 0
	$scope.followingNumber = 0;
    
	
	var ids = [];
	for (var i = 0;i < $scope.suggestedFriends.length; i++){
		ids.push($scope.suggestedFriends[i]["id"]);
	}
	
	$scope.loadToUI = function(users,already,mode){
			//Clear the body
			document.getElementById("modalChildren").innerHTML = "";
			
			var container = document.getElementById("modalChildren");
			for (var i = 0; i < users.length; i++) {
				var choice = $scope.searchUsers != null ? $scope.searchUsers : "";
				if (mode != "filter" || (users[i]["nickname"].toLowerCase().startsWith(choice.toLowerCase())) || choice == ""){
						
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
					
					//Column Three
					var col3 = document.createElement('div');
					col3.className = "col-md-6";
					
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
					//users[i]["alreadyFriends"]
					userTitle.style.fontSize = "24px";
					
					col2.appendChild(userTitle);
					
					//Create Button
					var buttonObj = document.createElement("button");
					col3.appendChild(buttonObj);
					if (already[i]){
						var t = document.createTextNode("Unfollow");       // Create a text node
					}
					else{
						var t = document.createTextNode("Add follower");
					}
					
					//Create the button
					buttonObj.appendChild(t);
					buttonObj.setAttribute("userID",users[i]['user_id']);
					buttonObj.setAttribute("following",already[i]);
					
					$(buttonObj).click(function($this) {
						var userid = $this.target.getAttribute("userID");
						var following = $this.target.getAttribute("following");
						if (following == "true"){
							($this.target.firstElementChild||$this.target.firstChild).nodeValue = "Add follower";
							$this.target.setAttribute("following","false");
							$scope.removeFollower(userid);
						}
						else{
							($this.target.firstElementChild||$this.target.firstChild).nodeValue = "Unfollow";
							$this.target.setAttribute("following","true");
							$scope.addFollower(userid);
						}
					});
					
					buttonObj.className = "";
					
					//Append children to userNode
					userNode.appendChild(col1);
					userNode.appendChild(col2);
					userNode.appendChild(col3);

				

				   
					
					//Add element to container!
					container.appendChild(userNode);
				}
					
			}
	}
	
	//Function to pull search results for people to follow
	$scope.findUsers = function(){
		var searchText = document.getElementById("searchUsers");

		//Need to load them into the popup (clear popup elements first)
		//Then load profile pic + Link to Profile (Titled with name) + Checkbox (notifies whether already friends or not)
		
		if (searchText.value == "" && $scope.mutualFriendsLoadedONCE){
			$scope.loadToUI($scope.mutualRecommendedUsers,$scope.mutualRecommendedUsers_already,"");
			return;
		}
		
		//Grab a list of all the users
		$http({
		 url: 'http://localhost:3001/secured/account/id/search',
		method: 'GET',
		params: {searchString: $scope.searchUsers, userID: myUserId, suggestedFriends: ids}
		}).then(function(response) {
			
			//Obtain the search suggestions
			var s_users = response["data"]["suggestions"][0];
			
			//Obtain the mutual friend suggestions
			var m_users = response["data"]["suggestions"][1];
			
			//already friends?
			var s_already = response["data"]["suggestions"][2];
			var m_already = response["data"]["suggestions"][3];
			
			//Store mutual suggestions for faster retrieval!
			$scope.mutualRecommendedUsers = m_users;
			$scope.mutualRecommendedUsers_already = m_already;
			
			//Let's us know we've loaded mutuals already so we don't need to reload every time.
			$scope.mutualFriendsLoadedONCE = true; 
			
			//Which set to use?
			if (searchText.value == ""){
				users = m_users;
				already = m_already;
			}else{
				users = s_users;
				already = s_already;				
				
				//Remove yourself from the users list!
				for (var i = 0;i<users.length;i++){
					if (users[i]["user_id"] == myUserId){
						users.splice(i,1);
						already.splice(i,1);
					}
				}
			}
			
			$scope.loadToUI(users,already,"");
			

		});
   }
	
	$scope.pullIDS = function(users){
		var ids = [];
		for (var i = 0;i < users.length; i++){
			ids.push(users[i]["user_id"]);
		}
		
		return ids;
	}
	
	//Load Data for Follower Modal
	$scope.loadFollower_Following_Lists = function(){
		$http({
            url: 'http://localhost:3001/secured/account',
            method: 'GET'
        }).then(function(response) {
            var data = (response['data']['songs']);
            for (var i = 0; i < data.length; i++) {
                if (data[i]["user_id"] == id) {
                    $scope.profilepic = data[i]["picture"];
					$scope.followers = data[i]["followers"];
					$scope.following = data[i]["following"];
                }
            }
			
			$http({
			 url: 'http://localhost:3001/secured/account/id/search',
			method: 'GET',
			params: {searchString: $scope.searchUsers, userID: myUserId, suggestedFriends: $scope.followers}
			}).then(function(response) {
				$scope.followers = response["data"]["suggestions"][1];
				$scope.followers_already = response["data"]["suggestions"][3];
		
				$scope.searchedUsers = response["data"]["suggestions"][0];
				$scope.searchedUsers_already = response["data"]["suggestions"][2];
				
			});
			
			
			$http({
			 url: 'http://localhost:3001/secured/account/id/search',
			method: 'GET',
			params: {searchString: $scope.searchUsers, userID: myUserId, suggestedFriends: $scope.following}
			}).then(function(response) {
				console.log("LEGEND");
				console.log($scope.following);
				console.log(response["data"]);
				
				$scope.following = response["data"]["suggestions"][1];
				$scope.following_already = response["data"]["suggestions"][3];
		
				$scope.searchedUsers = response["data"]["suggestions"][0];
				$scope.searchedUsers_already = response["data"]["suggestions"][2];
				
			});
			
			
		});
	}

	//Same as "Add Followers" code.. but literally just pulling from your followers list
	$scope.pullPeople = function(people){
		if (people == "followers"){
			var users = $scope.followers;
			var already = $scope.followers_already;
		}
		else if (people == "following"){
			var users = $scope.following;
			var already = $scope.following_already;
		}
		else{
			//Only other case -> Add Followers
			$scope.findUsers();
			return;
		}
		
		$scope.loadToUI(users,already,"filter");
	}
	
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		$scope.updateResults(); 
	});

	$scope.updateResults = function(){
		//Find which choice has been tabbed
		var choice = 0;
		for (var i = 0;i < document.getElementById("tabContent").children.length;i++){
			if (document.getElementById("tabContent").children[i].className == "active"){
				choice = i;// document.getElementById("tabContent").children[i].text;
			}
		}
		//alert(choice);
		//If the first tab (Add Followers) is selected, do action.
		if (choice == "0"){
			$scope.findUsers();
		}
		//My Followers
		else if (choice == "1"){
			$scope.pullPeople("followers");
		}
		//Who I'm Following
		else if (choice == "2"){
			$scope.pullPeople("following");
		}
		else{
			//Impossible case.
			$scope.findUsers();
			alert($scope.mutualFriendsLoadedONCE);
		}
	}
	
	$scope.findUsers();
	
	window.legendX = auth;
    if (prof["given_name"] != null) {
        $scope.owner = prof["given_name"];
    } else {
        $scope.owner = prof["nickname"];
    }
	
   
    $scope.suggested = [];

    $scope.initialFollowers = function() {
		console.log ("Suggested Swag");
		console.log($scope.suggestedFriends);
		
		var ids = [];
		for (var i = 0;i < $scope.suggestedFriends.length; i++){
			ids.push($scope.suggestedFriends[i]["id"]);
		}
		
		console.log(ids);
        $http({
            url: 'http://localhost:3001/secured/account/idBatch',
            method: 'GET',
            params: {
                users: ids
            }
        }).then(function(response) {
            if (response.status == 200) {
               console.log(response["data"]["user"]);
               $scope.suggested = response["data"]["user"];
			   
				console.log($scope.suggested);
            }
        }); // end of http get
     
    }
    



    $scope.initialFollowers();



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
		var id = prof["identities"][0]["user_id"];
        $http({
            url: 'http://localhost:3001/secured/account/id',
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
		
		var likestatus = document.getElementById("likestatus" + index);
		var like = document.getElementById("like" + index);
		
		if (likestatus.innerHTML == "Unlike"){
			like.innerHTML = parseInt(like.innerHTML) - 1;
			document.getElementById("likestatus" + index).innerHTML = "Like";
		}
		else{
			like.innerHTML = parseInt(like.innerHTML) + 1;
			document.getElementById("likestatus" + index).innerHTML = "Unlike";
		}
				
        $http.post('http://localhost:3001/secured/account/id/likes/song/id', {data: likes}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {
        	console.log(data);
				
            })
		.error(function(data, status, headers, config) {
            console.log(status);
        });
       
    }
	
	
	//when you favorite a song
    $scope.favorite = function(song_id, index) {
		var favorites = document.getElementById("favorites" + index);

		if (favorites.className == "disable-selection glyphicon glyphicon-star-empty"){
			favorites.style.color = "red"
			favorites.className = "disable-selection glyphicon glyphicon-star"
		} else if (favorites.className == "disable-selection glyphicon glyphicon-star") {
			favorites.style.color = "black"
			favorites.className = "disable-selection glyphicon glyphicon-star-empty";
		} 

				
        var favorite = JSON.stringify({
            posted_user_id: myUserId, 
            song_id: song_id, 
            liked_user_id: id
        });
        $http.post('http://localhost:3001/secured/account/id/favorite/song/id', {data: favorite}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {


        }).error(function(data, status, headers, config) {
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

   
	
	
	//Function to follow someone
    $scope.addFollower = function(follower_user_id) {
        var followerData = JSON.stringify({
			user_id: myUserId,
            other_id: follower_user_id
        });
        $http.post('http://localhost:3001/secured/account/id/addfollower', {data: followerData}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {
				if (data["userAlreadyInList"] == false){
					
					$scope.followingNumber +=1;
					
					$scope.numfollowers = ($scope.followersNumber);
					$scope.numfollowing = ($scope.followingNumber);
					
					$scope.loadFollower_Following_Lists();
				}
            })
		.error(function(data, status, headers, config) {
            ;
        });
        
    }
	
	//Function to unfollow someone
	$scope.removeFollower = function(follower_user_id) {
        var followerData = JSON.stringify({
			user_id: myUserId,
            other_id: follower_user_id
        });
        $http.post('http://localhost:3001/secured/account/id/removefollower', {data: followerData}, { 
              headers: {
              'Accept' : '*/*',
              'Content-Type': 'application/json'
             }
        }).success(function(data, status, headers, config) {
				if (data["userAlreadyInList"] == true){
					
					$scope.followingNumber -=1;
					
					$scope.numfollowers = ($scope.followersNumber);
					$scope.numfollowing = ($scope.followingNumber);
					
					$scope.loadFollower_Following_Lists();
				}
            })
		.error(function(data, status, headers, config) {
            ;
        });
       
    }
	
	
	
	$scope.findMutualFriends = function(){
		
	}


	//Load the user information from the DataBase
    $scope.getUserInfo = function() {
        $http({
            url: 'http://localhost:3001/secured/account/id',
            method: 'GET',
			params: {id: myUserId}
        }).then(function(response) {
			var myUserObj = response["data"]["user"];
	
			$scope.profilepic = myUserObj["picture"];
			$scope.followers = myUserObj["followers"];
			$scope.following = myUserObj["following"];
			
			var postCount = myUserObj["song_history"].length;
			if (postCount == 1) {
				$scope.numposts = postCount;
				$scope.posts = "Post"
			}
			else {
				$scope.numposts = postCount;
				$scope.posts = "Posts";
			};
                
            });
    }


     
    $scope.getAllLocations = function() {
        $http({
            url: 'http://localhost:3001/secured/location' ,
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
	  $scope.loadFollower_Following_Lists();



       // $(function() {
       //      var offset = $("#sidebar").offset();
       //      var topPadding = 0;
       //      $(window).scroll(function() {
       //          if ($(window).scrollTop() > offset.top) {
       //              $("#sidebar").stop().animate({
       //                  marginTop: $(window).scrollTop() - offset.top + topPadding
       //              });
       //          } else {
       //              $("#sidebar").stop().animate({
       //                  marginTop: 0
       //              });
       //          };
       //      });
       //  });



});