angular.module('inTunity.addSong', [
        'auth0'
    ])
    .controller('AddSongCtrl', function AddSongController($scope, auth, $location, store, $http, $compile, musicStatus, $cookies) {
        $scope.auth = auth;
        $scope.tgState = false;
        $scope.search = "";
		
        var globalPlayer;

        SC.get('/resolve', {
		  url: 'http://api.soundcloud.com/tracks/49931'
		}, function(user) {
		  alert(user);
		});



		$scope.pullSongInfo_FromEchoNest = function(songObj) {


           
			var title = songObj["title"];

			//1.Remove the (inner bracket text) [inner bracket text]
			title = title.replace(/ *\([^)]*\) */g, "");
			title = title.replace(/ *\[[^)]*\] */g, "");
			
			//2.Remove the leading artist info "Artist - "
			if (title.indexOf("-") > -1){
				title = title.slice(title.indexOf("-")+1);
				title = title.trim();
			}
			
			if (title.indexOf("~") > -1){
				title = title.slice(title.indexOf("~")+1);
				title = title.trim();
			}
			
            //3.convert punctuations to spaces
            title = title.replace(/['";:,~\/?\\-]/g, ' ');

            // convert multiple white space to single white space
            var song_title = title.replace(/\s\s+/g, ' ');

	

			var song_artist = songObj["name"];

			
			//permalink better
			
			//alert(songObj["permalink"].replace(/-/g, " "));
			//alert(song_title);
			return $http({ 
                url: 'http://localhost:3001/secured/EchoNest/SearchSong',
                method: 'GET',
                params: {
					api_key: "V1RYZWZCKQTDXGWAB",
                    artist: song_artist,
					title: song_title
                }
            }).then(function(response) {

				var songs = response["data"]["result"]["response"]["songs"];
				//Making the assumption that EchoNest's searching system is perfect, so results are in order of likelihood being correct.
				//So for now just use the first matching result. Maybe let user verify or add other checking measures in the future.
					

                if (songs.length > 0) {
                    window.outputX = songs;
                    var matchingSong = songs[0];
                    var songId = songs[0]["id"];
                    var energy = songs[0]["audio_summary"]["energy"];
                    var danceability = songs[0]["audio_summary"]["danceability"];
                    var tempo = songs[0]["audio_summary"]["tempo"];


                    //Pull the Song's Genre and Other information
                    return $http({ 
                        url: 'http://localhost:3001/secured/EchoNest/PullSongInfo',
                        method: 'GET',
                        params: {
                            api_key: "V1RYZWZCKQTDXGWAB",
                            song_id: songId
                        }
                    }).then(function(response2) {

                        var c = document.getElementById("genre-body");
                    

                        var songs2 = response2["data"]["result"]["response"]["songs"];

                        if (songs2.length > 0) {
                            var song = songs2[0];
                            var song_genre = song["song_type"];

                            var info = document.createElement("p");
                            info.innerHTML = "Energy: " + energy + ", Dance: " + danceability + ", Tempo: " + tempo;
                            c.appendChild(info);

                            for (var i = 0; i < song_genre.length; i++) {

                                var row = document.createElement("div");
                                row.className = "row";

                                var e = document.createElement("input");
                                e.setAttribute("type", "radio");
                                e.setAttribute("value", song_genre[i]);
                                e.setAttribute("checked", true);
                                e.setAttribute("name", song_genre[i]);

                                var txt = document.createElement("span");
                                txt.innerHTML = song_genre[i];
                               
                         

                        
                                row.appendChild(e);
                                row.appendChild(txt);
                                c.appendChild(row);
                            }
                            return true;
                        } else {
                            return false;
                        }


                       
                 
                    });
                } else {
                    return false;
                }
            }); // end of http get
		}
		
        // Spotify - find genres associated with that arist
        $scope.findGenreFromArtistSpotify = function(searchartist) {
            $http({ 
                url: 'http://localhost:3001/secured/artist/search-genre/spotify',
                method: 'GET',
                params: {
                    artist: searchartist
                }
            }).then(function(response) {
                var obj = response["data"]["result"]["artists"]["items"];
                if (obj.length > 0) {
                   console.log(obj[0]["genres"]);
                }
               
            }); // end of http get
        }

        // Spotify - find artist based off title
        $scope.findArtistFromTitleSpotify = function(obj) {
            $http({ 
                url: 'http://localhost:3001/secured/search/track/spotify',
                method: 'GET',
                params: {
                    title: obj["title"]
                }
            }).then(function(response) {

                var result = response["data"]["result"]["tracks"]["items"];
                if (result.length > 0) {
                    $scope.findGenreFromArtistSpotify(result[0]["artists"][0]["name"]);
                }
               
               
            }); // end of http get
        }






		
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
                url: 'http://localhost:3001/secured/account/id',
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
							window.swag = obj;
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
                           


                            confirmSong.className = 'intunity-button play-button confirmSong';
                            playbutton.id = i;
                            confirmSong.id = i;

                            

                            confirmSong.onclick = function() {


                            
                                var selectedSong = obj[this.id];
                                console.log(selectedSong);


                                var id = (selectedSong["id"]);
                                // numClicked += 1;
                                // if (numClicked == 1) {
                                    $scope.confirmGenre(selectedSong);
                                    //$scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);
                                // }

                              

                            }

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


        $scope.confirmGenre = function(obj) {

            console.log(obj);
            $("#genreModal").modal();
 
			var c = document.getElementById("genre-body");
			c.innerHTML = "";

            var button_row = document.getElementById("confirm-row-genre");
            button_row.innerHTML = "";


            var b = document.createElement("button");
            b.innerHTML = "Confirm";
            button_row.appendChild(b);
				

			$scope.pullSongInfo_FromEchoNest(obj).then(function(bool) {
				if (bool == false) {
					$scope.findArtistFromTitleSpotify(obj);
				} 
                $(b).on("click", function(){ 
                    $('#genreModal').modal('hide');
                    $scope.selectSong(obj["permalink_url"], obj["artwork_url"], obj["title"], obj["id"], obj["duration"]);
                    
                });
			});

          
        }
        



        $scope.selectSong = function(url, artwork, title, trackid, duration) {

                


				var confirmButtonOBJ = document.getElementById("confirmButtonOBJ");
				if (confirmButtonOBJ != null){
					confirmButtonOBJ.parentNode.removeChild(confirmButtonOBJ);
				}
					
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
								var city = "";
								var state = "";
								var country = "";
loopOuter:
								for (var objN = 0; objN < results.length; objN++){
									for (var ab = 0;ab < results[objN]["address_components"].length; ab++){
										if (results[objN]["address_components"][ab]["types"].indexOf("locality") > -1){
											city = results[objN]["address_components"][ab]["short_name"];
										}
										
										else if (results[objN]["address_components"][ab]["types"].indexOf("administrative_area_level_1") > -1){
											state = results[objN]["address_components"][ab]["short_name"];
										}
										
										else if (results[objN]["address_components"][ab]["types"].indexOf("country") > -1){
											country = results[objN]["address_components"][ab]["short_name"];
										}
										
										if (city != "" && state != "" && country != ""){
											break loopOuter;
										}
									}
								}
								
                                var song_json = JSON.stringify({
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

                                
                          


                                $http.post('http://localhost:3001/secured/account/id/song', {
                                    data: song_json
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
                    var song_json = JSON.stringify({
                        user_id: id,
                        song_url: url,
                        song_artwork: updatedSongPic,
                        song_title: title,
                        unix_time: today.getTime() / 1000,
                        track_id: trackid,
                        song_duration: duration,
                        locationFlag: false
                    });


                    $http.post('http://localhost:3001/secured/account/id/song', {
                        data: song_json
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