var feed = [];
var app = Sammy('#main', function() {
    this.use(Sammy.Mustache, 'ms');
    this.get('#/', function() {
        this.trigger('getFeed');
    });
    this.get('#Login', function() {
       var consumerKey = '71b454c797a58e8de5df33137e95cb8c';
       window.open('http://dev.status.net:8080/index.php/api/oauth2/authorize?response_toke=token&client_id=' + consumerKey);
    });
    this.post('#Post', function() {
       var that = this;
       $.ajax({
          url: 'http://dev.status.net:8080/index.php/api/statuses/update.json?oauth_token=' + oauth2.authParameters['access_token'],
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
            url: 'http://localhost:8080/statusnet_js_mashup/backend/oembed.json',
            success: function(result) {
                that.widget = html_sanitize(result.html);
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
          url: 'http://dev.status.net:8080/index.php/api/statuses/home_timeline.json?oauth_token=' + oauth2.authParameters['access_token'],
          success: function(response) {
              feed = response;
              that.trigger('renderFeed');
              that.trigger('connect');
          }
        });
    });
    this.bind('renderFeed', function() {
        this.feed = feed;
        this.partial('js/templates/feed.ms');
    });
    this.bind('connect', function() {
        var that = this;
        var socket = new io.Socket('127.0.0.1', {port: 8000, rememberTransport: false});
        socket.connect();
        socket.on('message', function(obj){
            if (obj === 'hello') {
                return;
            }
            xmlDoc=$(obj);
            xmlDoc.find('entry').each(function() {
               feed = [{
                  'statusnet_html': $(this).find('content').text(),
                  'created_at': $(this).find('published').text(),
                  'user': {
                      'name': xmlDoc.find('author').find('poco\\:displayName').text()
                  }
               }].concat(feed);
               that.trigger('renderFeed');
            });
        });

        socket.on('connect', function(){
            console.log('connected');
            that.trigger('subscribe');
        });
        socket.on('disconnect', function(){console.log('disconnected'); });
        socket.on('reconnect', function(){ console.log('reconnected'); });
    });
    this.bind('subscribe', function() {
       console.log('subscribe to feed');
       var feed = 'http://dev.status.net:8080/index.php/api/statuses/user_timeline/1.atom';
       var hub = 'http://dev.status.net:8080/index.php/main/push/hub';
       $.ajax({
          url: hub,
          type: 'POST',
          data: {
              'hub.topic': feed,
              'hub.callback': 'http://127.0.0.1:8000/',
              'hub.mode': 'subscribe',
              'hub.verify': 'async'
          },
          success: function(response) {
              console.log(response);
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
