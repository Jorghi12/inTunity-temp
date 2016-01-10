angular.module('inTunity.addSong', [
        'auth0'
    ])
    .controller('AddSongCtrl', function AddSongController($scope, auth, $location, store, $http, $compile, musicStatus, $cookies) {
        $scope.auth = auth;
        $scope.tgState = false;
        $scope.search = "";
		
        var globalPlayer;

        var prof = (store.get('profile'));
        $scope.owner;
        if (prof["given_name"] != null) {
            $scope.owner = prof["given_name"];
        } else {
            $scope.owner = prof["nickname"];
        }

        $scope.position;

        var id = auth.profile["identities"][0]["user_id"];

        var trackarray;
        var song_count;
        var prevTime;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        }

        function showPosition(position) {
            localStorage.setItem("latitude", position.coords.latitude);
            localStorage.setItem("longitude", position.coords.longitude);
            localStorage.setItem("location-error", "NO_ERROR");
        }

        function showError(error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    localStorage.setItem("location-error", "PERMISSION_DENIED");
                    break;
                case error.POSITION_UNAVAILABLE:
                    localStorage.setItem("location-error", "POSITION_UNAVAILABLE");
                    break;
                case error.TIMEOUT:
                    localStorage.setItem("location-error", "TIMEOUT");
                    break;
                case error.UNKNOWN_ERROR:
                    localStorage.setItem("location-error", "UNKNOWN_ERROR");
                    break;
            }
        }

		
        $scope.startStreamingAddSong = function(songUrl, artworkUrl, myTitle, trackid, songDuration) {
            window.startStreamCustom(songUrl, artworkUrl, myTitle, trackid, songDuration, "", "addsong",false);
        }


        $scope.logout = function() {
            window.logout();
        }

        $scope.home = function() {
            $location.path('/');
        }

        $scope.profile = function() {
            $http({
                url: 'http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/account/id',
                method: 'GET',
                params: {
                    id: id
                }
            }).then(function(response) {
                console.log(response["data"]["user"]);
                username_url = response["data"]["user"]["url_username"];
                store.set('username_clicked', username_url);
                $location.path('/profile/' + username_url);

            }); // end of http get

        }

        $scope.about = function() {
            $location.path('/about');
        }

        function millisToMinutesAndSeconds(millis) {
            var minutes = Math.floor(millis / 60000);
            var seconds = ((millis % 60000) / 1000).toFixed(0);
            return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
        }

        $scope.findSong = function() {

                var name = $scope.search;
                var container = document.getElementById("searchResults");
                container.innerHTML = "";

                if (name == "") {
                    container.innerHTML = "<h3>Please Enter a Search Query</h3>";
                } else if (name.indexOf("<") != -1 || name.indexOf(">") != -1) {
                    container.innerHTML = "<h3>Please Enter a Valid Query</h3>";
                } else {

                    //searching for specific genres / artists
                    var page_size = 100;
                    SC.get('/tracks', {
                        q: name,
                        limit: page_size
                    }).then(function(tracks) {

                        var streamableSongs = [];
                        for (var i = 0; i < tracks.length; i++) {
                            if (tracks[i]["streamable"] == true) {
                                streamableSongs.push(tracks[i]);
                            }
                        }

                        var obj = (streamableSongs);
                        for (var i = 0; i < obj.length; i++) {

                            var albumArtwork;
                            if (obj[i]['artwork_url'] != null) {
                                var album = obj[i]['artwork_url'];
                                var index = album.indexOf("large");
                                albumArtwork = album.substring(0, index) + "t500x500.jpg";
                            } else {
                                albumArtwork = "/images/no-art.png";
                            }

                            var songContainer = document.createElement('div');
                            songContainer.className = "col-md-6 search-result";

                            var col1 = document.createElement('div');
                            col1.className = "col-md-6";


                            var img = document.createElement('img');
                            img.className = "album-artwork";
                            img.src = albumArtwork;

                            col1.appendChild(img);

                            var col2 = document.createElement('div');
                            col2.className = "col-md-6 search-info";


                            var songTitle = document.createElement('h4');
                            songTitle.innerHTML = obj[i]["title"];

                            var likes = document.createElement('h5');
                            likes.innerHTML = "Soundcloud likes: " + obj[i]["likes_count"];

                            var duration = document.createElement("h5");
                            duration.innerHTML = "Time: " + millisToMinutesAndSeconds(obj[i]["duration"]);

                            var playbutton = document.createElement("a");
                            playbutton.href = "";
                            playbutton.innerHTML = "<div class='intunity-button play-button'><h4>" + "Sample Song" + "</h4></div>";

                            playbutton.onclick = function() {
                                document.getElementsByClassName("footer")[0].className = "footer footer-sample";
                                var selectedSong = obj[this.id];
                                var id = (selectedSong["id"]);

                                $scope.startStreamingAddSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);


                            }

                            var confirmSong = document.createElement("div");
                            confirmSong.innerHTML = "<h4>Confirm</h4>";


                            var numClicked = 0;
                            confirmSong.onclick = function() {

                                var selectedSong = obj[this.id];
                                var id = (selectedSong["id"]);

                                numClicked += 1;
                                if (numClicked == 1) {
                                    $scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);
                                }

                              

                            }


                            confirmSong.className = 'intunity-button play-button confirmSong';
                            playbutton.id = i;
                            confirmSong.id = i;

                            var playElement = $compile(playbutton)($scope)[0];
							
                            col2.appendChild(songTitle);
                            col2.appendChild(likes);
                            col2.appendChild(duration);
                            col2.appendChild(playElement);
                            col2.appendChild(confirmSong);

                            songContainer.appendChild(col1);
                            songContainer.appendChild(col2);

                            container.appendChild(songContainer);
                        }
                    });
                }


            } // end of findSong



        var expirationDate = new Date();
        var numberOfDaysToAdd = 10;
        expirationDate.setDate(expirationDate.getDate() + numberOfDaysToAdd);



        $scope.selectSong = function(url, artwork, title, trackid, duration) {

                if (artwork != null) {
                    var index = artwork.indexOf("large");
                    updatedSongPic = artwork.substring(0, index) + "t500x500.jpg";
                } else {
                    updatedSongPic = "/images/no-art.png";
                }


                var today = new Date();




                var location_error = localStorage.getItem("location-error");
                var latitude = parseFloat(localStorage.getItem("latitude"));
                var longitude = parseFloat(localStorage.getItem("longitude"));

                if (location_error == "NO_ERROR" && localStorage.getItem("latitude") != "" && localStorage.getItem("longitude") != "") {

                    var geocoder = new google.maps.Geocoder;
                    var latlng = {
                        lat: parseFloat(latitude),
                        lng: parseFloat(longitude)
                    };

                    geocoder.geocode({
                        'location': latlng
                    }, function(results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            if (results[1]) {
                                var state = results[2]["address_components"][1]["short_name"];
                                var city = results[1]["address_components"][1]["short_name"];

                                var song = JSON.stringify({
                                    user_id: id,
                                    song_url: url,
                                    song_artwork: updatedSongPic,
                                    song_title: title,
                                    unix_time: today.getTime() / 1000,
                                    track_id: trackid,
                                    song_duration: duration,
                                    state: state,
                                    city: city,
                                    locationFlag: true
                                });




                                $http.post('http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/account/id/song', {
                                    data: song
                                }, {
                                    headers: {
                                        'Accept': '*/*',
                                        'Content-Type': 'application/json'
                                    }
                                }).success(function(data, status, headers, config) {

                                    musicStatus.confirmSong();
                                    curStats = musicStatus.getStatus();
                                    $cookies.put('songNum', curStats[0], {
                                        expires: expirationDate
                                    });
                                    $cookies.put('songPos', curStats[1], {
                                        expires: expirationDate
                                    });
                                    $location.path('/');


                                }).error(function(data, status, headers, config) {
                                    console.log(status);
                                });

                                localStorage.removeItem("latitude");
                                localStorage.removeItem("longitude");
                                localStorage.removeItem("location-error");



                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                    });
                } else {
                    // there is location error
                    var song = JSON.stringify({
                        user_id: id,
                        song_url: url,
                        song_artwork: updatedSongPic,
                        song_title: title,
                        unix_time: today.getTime() / 1000,
                        track_id: trackid,
                        song_duration: duration,
                        locationFlag: false
                    });


                    $http.post('http://ec2-52-33-76-106.us-west-2.compute.amazonaws.com:3001/secured/account/id/song', {
                        data: song
                    }, {
                        headers: {
                            'Accept': '*/*',
                            'Content-Type': 'application/json'
                        }
                    }).success(function(data, status, headers, config) {
                        console.log(status);
                        localStorage.removeItem("location-error");
                        musicStatus.confirmSong();
                        curStats = musicStatus.getStatus();
                        $cookies.put('songNum', curStats[0], {
                            expires: expirationDate
                        });
                        $cookies.put('songPos', curStats[1], {
                            expires: expirationDate
                        });
                        $location.path('/');


                    }).error(function(data, status, headers, config) {
                        console.log(status);
                    });

                } // end of else statement




            } // end of selectSong()



    });