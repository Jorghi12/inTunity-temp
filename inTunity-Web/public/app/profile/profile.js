angular.module( 'inTunity.profile', [
  'auth0'
])


.controller( 'ProfileCtrl',  function ProfileController( $scope, auth, $http, $location, store, $routeParams ) {


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

  $scope.about = function() {
    $location.path('/about');
  }



  $http({
    url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    var users = response["data"]["songs"];



    $scope.correctPerson = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i]["url_username"] == $routeParams.itemId) {
        $scope.correctPerson.push(users[i]);
      }  
    }

    console.log($scope.correctPerson);

    // $scope.whichItem = $routeParams.itemId;


    // // this array has users who only have songs with it
    // var correctUsers= [];
  
    // // makes sure we only show users who have songs
    // for (var i = 0; i < users.length; i++) {
    //   if (users[i]["today_song"]["song_url"] != "") {
    //     console.log("user has a song for today");
    //     correctUsers.push(users[i]);
    //   } else {
    //     console.log("user does not have a song for today");
    //   }
    // }

    // $scope.users = correctUsers;

    // console.log($scope.users);










  }); // end of http get







});





