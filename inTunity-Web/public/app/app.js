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
  'inTunity.location'
])
.config( function myAppConfig ( $routeProvider, authProvider, $httpProvider, $locationProvider,
  jwtInterceptorProvider) {
  $routeProvider
    .when( '/', {
      controller: 'HomeCtrl',
      templateUrl: '/app/home/home.html',
      pageTitle: 'Homepage',
      requiresLogin: true
    })
    .when( '/login', {
      controller: 'LoginCtrl',
      templateUrl: '/app/login/login.html',
      pageTitle: 'Login'
    })
    .when( '/add-song', {
      controller: 'AddSongCtrl',
      templateUrl: '/app/addSong/addSong.html',
      pageTitle: 'Add Song'
    })
    .when('/profile/:itemId', {
      templateUrl: 'app/profile/profile.html',
      controller: 'ProfileCtrl',
      pageTitle: 'Profile'
    })
    .when( '/about', {
      controller: 'AboutCtrl',
      templateUrl: '/app/about/about.html',
      pageTitle: 'About'
    })
    .when( '/location', {
      controller: 'LocationCtrl',
      templateUrl: '/app/location/location.html',
      pageTitle: 'Location'
    })



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
      $scope.pageTitle = nextRoute.$$route.pageTitle + ' | inTunity' ;
    }
  });
}).service('musicStatus', function () {  var songNumber = 0; var songPos = -1;
return {
getStatus: function () {
return [songNumber,songPos];
},
setStatus: function (num,pos) {
songNumber = num;
songPos = pos;
}
};
});




