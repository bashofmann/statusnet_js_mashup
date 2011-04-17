var app = Sammy('#main', function() {
    this.get('', function() {
        $.ajax({
          url: 'http://dev.status.net:8080/index.php/api/statuses/user_timeline/bastian.json',
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