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




    console.log($scope.correctPerson);




    // var date = new Date(users[i]["today_song"]["unix_time"] * 1000);

    //     var year = date.getFullYear();
    //     var month = date.getMonth();
    //     var day = date.getDate();
    //     var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

   

    //     var hours = date.getHours();

    //     var minutes = "0" + date.getMinutes();
    //     var am_pm = "AM";

    //     if (hours == 12) {
    //       am_pm = "PM";
    //     }

    //     if (hours > 12) {
    //       hours = hours - 12;
    //       am_pm = "PM";
    //     }
    //     if (hours == 0) {
    //       hours = 12;
    //     }






    console.log($scope.correctPerson);

  










  }); // end of http get







});





