angular.module( 'inTunity.location', [
  'auth0'
])


.controller( 'LocationCtrl',  function LocationController( $scope, auth, $http, $location, store ) {

  $scope.auth = auth;
  $scope.tgState = false;

  var prof = (store.get('profile'));

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



  $http({
    url: 'http://localhost:3001/secured/location' ,
    method: 'GET'
  }).then(function(response) {  
      console.log(response);

  }); // end of http get


 

 
 

});





