var app = Sammy('#main', function() {
    this.get('', function() {
      this.$element() // $('#main')
          .html('A new route!');
    });
});

jQuery(function() {
    app.run();
});