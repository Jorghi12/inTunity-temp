angular.module( 'inTunity.about', [
  'auth0'
])


.controller( 'AboutCtrl',  function AboutController( $scope, auth, $http, $location, store ) {


  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.home = function() {
    $location.path('/login');
  }

  $scope.addSong = function() {
    $location.path('/add-song');
  }

  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }


  $scope.about = function() {
    $location.path('/about');
  }

  $scope.splashScreen = function() {
    $location.path('/login');
  }

  $scope.signIn = function() {
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
      var picture = auth.profile["picture"];


 
      var user_account = JSON.stringify({
        user_id:id, 
        email: email, 
        nickname: nickname, 
        picture: picture}); // Indented with tab


      $location.path("/");


    $http.post('http://localhost:3001/secured/account', {data: user_account}, { 
        headers: {
        'Accept' : '*/*',
        'Content-Type': 'application/json'
       }
    }).success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          console.log(status);
      }).error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          console.log(status);
      });




    }, function(error) {
      console.log("There was an error logging in", error);
    });

  }


});





