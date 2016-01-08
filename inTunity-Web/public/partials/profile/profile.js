angular.module('inTunity.profile', [
    'auth0'
])


.controller('ProfileCtrl', function ProfileController($scope, auth, $http, $location, store, $routeParams, musicStatus) {


    $scope.auth = auth;

    var prof = (store.get('profile'));
    var count_todaysongs = 0;

    $scope.owner;
    if (prof["given_name"] != null) {
        $scope.owner = prof["given_name"];
    } else {
        $scope.owner = prof["nickname"];
    }
    var id = prof["identities"][0]["user_id"];

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
        url: 'http://localhost:3001/secured/account/id',
        method: 'GET',
        params: {
            id: id
        }
    }).then(function(response) {
        var ownpersonalusername = response["data"]["user"]["url_username"];
        var username_clicked = store.get('username_clicked');
        if (username_clicked != ownpersonalusername) {
            document.getElementById("selected-link").id = "";

        }
    }); // end of http get


    // for deleting a particular song on your own account
    $scope.deleteSong = function(userid, songid) {
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
                $http.delete('http://localhost:3001/secured/account/id/song', {
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json'
                    },
                    params: {
                        user_id: userid,
                        song_id,
                        songid
                    }
                }).success(function(data, status, headers, config) {
                    console.log(status);
                }).error(function(data, status, headers, config) {

                });
            }
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


    $scope.startStreamingProfileSong = function(songUrl, artworkUrl, myTitle, trackid, duration) {
        window.startStreamCustom(songUrl, artworkUrl, myTitle, trackid, duration, "profile");
    }

})
});