angular.module( 'inTunity', [
  'auth0',
  'ngRoute',
  'angular-storage',
  'angular-jwt',
  'inTunity.login',
  'inTunity.home',
  'inTunity.addSong',
  'inTunity.about',
  'inTunity.profile',
  'inTunity.location',
  'inTunity.stream'
])
.config( function myAppConfig ($routeProvider, authProvider, $httpProvider, $locationProvider,
  jwtInterceptorProvider) {


  $routeProvider
    .when( '/', {
      controller: 'HomeCtrl',
      templateUrl: '/partials/home/home.html',
      pageTitle: 'Homepage',
      requiresLogin: true
    })
    .when( '/login', {
      controller: 'LoginCtrl',
      templateUrl: '/partials/login/login.html',
      pageTitle: 'Login'
    })
    .when( '/add-song', {
      controller: 'AddSongCtrl', 
      templateUrl: '/partials/addSong/addSong.html',
      pageTitle: 'Add Song',
      requiresLogin: true
    })
    .when('/profile/:itemId', {
      templateUrl: 'partials/profile/profile.html',
      controller: 'ProfileCtrl',
      pageTitle: 'Profile',
      requiresLogin: true
    })
    .when( '/about', {
      controller: 'AboutCtrl',
      templateUrl: '/partials/about/about.html',
      pageTitle: 'About'
    })
    .when( '/location', {
      controller: 'LocationCtrl',
      templateUrl: '/partials/location/location.html',
      pageTitle: 'Location',
      requiresLogin: true
    })
    .otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);



  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];


  authProvider.init({
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    loginUrl: '/login',
    callbackURL: AUTH0_CALLBACK_URL
  });

  jwtInterceptorProvider.tokenGetter = function(store) {
    return store.get('token');
  }

  // Add a simple interceptor that will fetch all requests and add the jwt token to its authorization header.
  // NOTE: in case you are calling APIs which expect a token signed with a different secret, you might
  // want to check the delegation-token example
  $httpProvider.interceptors.push('jwtInterceptor');
}).run(function($rootScope, auth, store, jwtHelper, $location) {
  $rootScope.$on('$locationChangeStart', function() {
    if (!auth.isAuthenticated) {
      var token = store.get('token');
      if (token) {
        if (!jwtHelper.isTokenExpired(token)) {
          auth.authenticate(store.get('profile'), token);
        } else {
          $location.path('/login');
        }
      }
    }

  });
})



.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$routeChangeSuccess', function(e, nextRoute){
    if ( nextRoute.$$route && angular.isDefined( nextRoute.$$route.pageTitle ) ) {
      $scope.pageTitle = nextRoute.$$route.pageTitle + ' | INTUNITY' ;
    }
  });
})

.service('musicStatus', function () {
	//Create Window Object
	window.musicStatus = new Object();
	
	//Song State Variables
	window.musicStatus.songPaused = false; 
	window.musicStatus.songNumber = 0; 
	window.musicStatus.songPos = -1; 
	window.musicStatus.confirmSong = false;
	
	//Page State Variables
	var HOME = 0;
	var ADDSONG = 1;
	var PROFILE = 2;
	
	window.musicStatus.page = 0; //0 = Home, 1 = AddSong, 2 = Profile
	
	//Functions part of the musicStatus Object
	return {
		checkConfirm: function(){ 
			if (window.musicStatus.confirmSong == false){
				return false
			}
			else{
				window.musicStatus.confirmSong = false;
				return true;
			}
		},
		confirmSong: function(){
			window.musicStatus.songNumber = 0;
			window.musicStatus.songPos = -1;
			window.musicStatus.confirmSong = true;
		},
		getStatus: function () {
			return [window.musicStatus.songNumber,window.musicStatus.songPos,window.musicStatus.songPaused];
		},
		setStatus: function (num,pos,paused) {
			window.musicStatus.songNumber = num;
			window.musicStatus.songPos = pos;
			window.musicStatus.songPaused = paused;
		},
		setPage: function (url){
			if (url == "/add-song/") {window.musicStatus.page = ADDSONG} //Play song only once (used for addsong)
			else if (url == "/profile/") {window.musicStatus.page = PROFILE} //Play profile track
			else {window.musicStatus.page = HOME} //Play home track by default if none of the above
		}
	};
});