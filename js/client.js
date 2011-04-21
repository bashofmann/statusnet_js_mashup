var app = Sammy('#main', function() {
    this.use(Sammy.Mustache, 'ms');
    this.get('#/', function() {
        this.trigger('getFeed');
    });
    this.get('#Login', function() {
       var consumerKey = '2e70313dfb8a673a1ad84f441595b38e';
       window.open('http://status.net.xyz:8061/index.php/api/oauth2/authorize?response_toke=token&client_id=' + consumerKey);
    });
    this.post('#Post', function() {
       var that = this;
       $.ajax({
          url: 'http://status.net.xyz:8061/index.php/api/statuses/update.json?oauth_token=' + oauth2.authParameters['access_token'],
          type: 'POST',
          data: {
            'status': that.params['post']
          },
          success: function() {
              that.redirect('#/');
          }
       });
    });
    this.get('#Widget', function() {
        var that = this;
        $.ajax({
            url: 'http://localhost:8062/statusnet_js_client/backend/oembed.json',
            success: function(result) {
                that.widget = result.html;
                that.partial('js/templates/widget.ms');
            }
       });
    });
    this.bind('changed', resolveEmbeds);
    this.bind('getFeed', function() {
        oauth2.retrieveAccessToken();
        if (! oauth2.authParameters || ! oauth2.authParameters['access_token']) {
            this.redirect('#Login');
            return;
        }
        var that = this;
        $.ajax({
          url: 'http://status.net.xyz:8061/index.php/api/statuses/home_timeline.json?oauth_token=' + oauth2.authParameters['access_token'],
          success: function(response) {
              that.feed = response;
              that.partial('js/templates/feed.ms');
          }
        });
    });
});

jQuery(function() {
    app.run('#/');
});

var oauth2 = {
    authParameters: {},
    storeAccessToken : function(fragment) {
        fragment = fragment.split('+').join('%252b');
        fragment = fragment.split('&');
        for (var i = 0; i < fragment.length; i++) {
            var ix = fragment[i].indexOf('=');
            if (ix > 0) {
                oauth2.authParameters[fragment[i].substr(0, ix)] = decodeURIComponent(fragment[i].substr(ix + 1));
            }
        }
        localStorage.setItem("access_token", oauth2.authParameters['access_token']);
        app.trigger('getFeed');
    },
    retrieveAccessToken: function() {
        oauth2.authParameters['access_token'] = localStorage.getItem("access_token");
    }
}
