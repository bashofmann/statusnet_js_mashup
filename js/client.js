var app = Sammy('#main', function() {
    this.use(Sammy.Mustache, 'ms');
    this.get('', function() {
        this.trigger('getFeed');
    });
    this.bind('getFeed', function() {
        var that = this;
        $.ajax({
          url: 'http://status.net.xyz:8061/index.php/api/statuses/user_timeline/bastian.json',
          success: function(response) {
              console.log(response);
              that.feed = response;
              that.partial('js/templates/feed.ms');
          }
        });
    });
});

jQuery(function() {
    app.run();
});