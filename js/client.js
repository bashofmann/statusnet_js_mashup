var app = Sammy('#main', function() {
    this.get('', function() {
        $.ajax({
          url: 'http://status.net.xyz:8061/index.php/api/statuses/user_timeline/bastian.json',
          success: function(response) {
              console.log(response);
          }
        });
        this.$element() // $('#main')
          .html('A new route!');
    });
});

jQuery(function() {
    app.run();
});