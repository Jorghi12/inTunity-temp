angular.module( 'inTunity.login', [
  'auth0'
])
.controller( 'LoginCtrl', function LoginController( $scope, auth, $location, store, $http, $cookies) {

  $scope.about = function() {
    $location.path('/about');
  }

  $scope.login = function() {

    auth.signin({
      gravatar:true, 
      loginAfterSignup: true, 
      callbackOnLocationHash: false, 
      connections:['facebook', 'Username-Password-Authentication'],
    }, function(profile, token) {


      store.set('profile', profile);
      store.set('token', token);  

      var id = auth.profile["identities"][0]["user_id"];
      var connection = auth.profile["identities"][0]["connection"];
      var email = auth.profile["email"];
      var provider = auth.profile["identities"][0]["provider"];
      var nickname = auth.profile["name"];
      var picture;

      if(auth.profile["identities"][0]["connection"] == "facebook") {
        picture = "https://graph.facebook.com/" + id  + "/picture?height=9999";
      } else {
        picture = auth.profile["picture"];
      }

      var atSign = nickname.indexOf("@");
      var url_username = "";

      if (atSign != -1) {
        // is email
        url_username = nickname.substring(0,atSign);
      } else {
        // not email
        for (var i = 0; i < nickname.length; i++) {
          if (nickname.charAt(i) == " ") {
             url_username += ".";
          } else {
             url_username += (nickname.charAt(i));
          } 
        }
      }

      var user_account = JSON.stringify({
        user_id:id, 
        email: email, 
        nickname: nickname, 
        picture: picture,
        url_username: url_username
      });

		  
		//Return our preset Expiration Dates for new Cookies
		$scope.cookieExpirationDate = function() {
			//Perhaps in the future optimize this based on our findings
			var expirationDate = new Date();
			var numberOfDaysToAdd = 10;
			expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd);

			//Return the Date Object
			return expirationDate;
		}
	
		$cookies.put('songPaused', false, {
			expires: $scope.cookieExpirationDate()
		});
			
      $location.path("/");

      $http.post('http://ec2-52-33-107-31.us-west-2.compute.amazonaws.com:3001/secured/account', {data: user_account}, { 
          headers: {
          'Accept' : '*/*',
          'Content-Type': 'application/json'
         }
      }).success(function(data, status, headers, config) {
        console.log(status);
      }).error(function(data, status, headers, config) {
        console.log(status);
      });

    }, function(error) {
      
    });


  } // end of login function

});
