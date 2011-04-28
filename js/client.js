var feed = [];
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
                that.widget = html_sanitize(result.html);
                that.partial('js/templates/widget.ms');
            }
       });
    });
    this.bind('changed', function() {
        if ($('#gadget-chrome-0').length > 0) {
            container.init();
            container.renderGadgets();
        }
        resolveEmbeds();
    });
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
               window.webkitNotifications.createNotification(null, 'New message', $(this).find('content').text()).show();
               that.trigger('renderFeed');
            });
        });

        socket.on('connect', function(){
            console.log('connected');
            that.trigger('subscribe');
        });
        socket.on('disconnect', function(){console.log('disconnected');});
        socket.on('reconnect', function(){console.log('reconnected');});
    });
    this.bind('subscribe', function() {
       console.log('subscribe to feed');
       var feed = 'http://status.net.xyz:8061/index.php/api/statuses/user_timeline/3.atom';
       var hub = 'http://status.net.xyz:8061/index.php/main/push/hub';
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



var container = {};

container.gadgetSpecUrls = [
  'http://localhost:8062/statusnet_js_client/gadgets/hello_world.xml',
  'http://localhost:8062/statusnet_js_client/gadgets/sample-pubsub-publisher.xml',
  'http://localhost:8062/statusnet_js_client/gadgets/sample-pubsub-subscriber.xml'
];

container.LayoutManager = function() {
  shindig.LayoutManager.call(this);
};

container.LayoutManager.inherits(shindig.LayoutManager);

container.LayoutManager.prototype.getGadgetChrome = function(gadget) {
  var chromeId = 'gadget-chrome-' + gadget.id;
  return chromeId ? document.getElementById(chromeId) : null;
};

container.init = function() {
  gadgets.pubsubrouter.init(function(id) {
    var gadgetId = shindig.container.gadgetService.getGadgetIdFromModuleId(id);
    var gadget = shindig.container.getGadget(gadgetId);
    return gadget.specUrl;
  }, {
    onSubscribe: function(sender, channel) {
      console.log(sender + " subscribes to channel '" + channel + "'");
      // return true to reject the request.
      return false;
    },
    onUnsubscribe: function(sender, channel) {
      console.log(sender + " unsubscribes from channel '" + channel + "'");
      // return true to reject the request.
      return false;
    },
    onPublish: function(sender, channel, message) {
      console.log(sender + " publishes '" + message + "' to channel '" + channel + "'");
      // return true to reject the request.
      return false;
    }
  });
  shindig.container.layoutManager = new container.LayoutManager();
};

container.renderGadgets = function() {
  shindig.container.setParentUrl("http://" + window.location.host + "/");
  for (var i = 0; i < container.gadgetSpecUrls.length; ++i) {
    var gadget = shindig.container.createGadget(
        {debug:1,specUrl: container.gadgetSpecUrls[i], title: "Gadget"});
    gadget.setServerBase('http://localhost:8080/gadgets/');
    shindig.container.addGadget(gadget);
    shindig.container.renderGadget(gadget);

  }
};
