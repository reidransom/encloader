// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  var selectText = "Choose:";
  
  var option_template = _.template($('#option-template').html());

  var getSources = function() {
    var sources = [];
    if (1) {
      sources = [
        {
          name: "Local",
          encoders: [
            {
              name: "Web Post (HD)",
              cmd: "HandbrakeCLI make HD video",
              extension: ".mp4"
            },
            {
              name: "Web Post (SD)",
              cmd: "Handbrake CLI make SD video",
              extension: ".mp4"
            }
          ],
          uploaders: [
            {
              name: "Desktop",
              path: "~/Desktop"
            },
            {
              name: "Example FTP",
              host: "ftp.example.com",
              user: "username",
              passwd: "password"
            },
            {
              name: "Example FTP 2",
              host: "ftp.example.com",
              user: "username",
              passwd: "password"
            }
          ]
        }
      ];
    }
    return sources;
  };
  var sources = getSources();
  
  var getEncoders = function() {
    var encoders = [];
    _.each(sources, function(source) {
      _.each(source.encoders, function(encoder) {
        encoders.push(_.extend(encoder, {source: source.name}));
      });
    });
    return encoders;
  };

  var getUploaders = function() {
    var uploaders = [];
    _.each(sources, function(source) {
      _.each(source.uploaders, function(uploader) {
        uploaders.push(_.extend(uploader, {source: source.name}));
      });
    });
    return uploaders;
  };

  
  
  // EncodeJob Model
  // ---------------
  
  window.EncodeJob = Backbone.Model.extend({

    defaults: {
      status: "pending",
      percent: 0,
      preset: 0
    },

    initialize: function() {
      if (!this.get("status")) {
        this.set(this.defaults);
      }
    }

  });


  // Uploader List View
  var UploaderListView = Backbone.View.extend({
    
    tagName: "div",
    
    events: {
      "change select.add-uploader": "addItem"
    },

    initialize: function() {
      $(this.el).html($("#uploader-list-template").html());
      this.select = this.$("select.add-uploader");
      
      _.bindAll(this, "render", "addItem");
      this.counter = 0;
    },

    render: function() {
      var select = this.select;
      select.html(option_template({
        value: "",
        text: selectText
      }));
      _.each(getUploaders(), function(uploader, i) {
        select.append(option_template({
          value: i,
          text: "&nbsp;&nbsp;" + uploader.source + " / " + uploader.name
        }));
      });
      return this;
    },

    addItem: function() {
      this.counter++;
      this.$("ul.uploader-list").append("<li>hi there " + this.counter + "</li>");
    }

  });

  
  // Encoder Model
  // -------------

  window.Encoder = Backbone.Model.extend({

    // Default attributes
    defaults: function() {
      return {
        encoder: 0,
        uploaders: [0],
        order: Encoders.nextOrder()
      };
    }

  });

  
  // EncoderList Collection
  // ---------------

  window.EncoderList = Backbone.Collection.extend({

    model: Encoder,

    localStorage: new Store("encoders"),

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Create our global collection of **Todos**.
  window.Encoders = new EncoderList;

  
  // Encoder View
  // ------------

  window.EncoderView = Backbone.View.extend({

    tagName:  "li",

    template: _.template($('#encoder-template').html()),

    events: {
      "click span.destroy" : "clear",
    },

    // The TodoView listens for changes to its model, re-rendering. Since 
    // there's a one-to-one correspondence between a **Todo** and a 
    // **TodoView** in this app, we set a direct reference on the model for
    // convenience.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    render: function() {
      
      $(this.el).html(this.template(_.extend(
        this.model.toJSON(), {
          availEncoders: getEncoders()
        }
      )));
      
      // Add the uploader list
      var view = new UploaderListView();
      $(this.el).append(view.render().el);

      return this;
    },

    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });
  
  
  // EncoderList View
  // ---------------

  window.EncoderListView = Backbone.View.extend({

    tagName: "div",

    className: "encoder-list",
    
    events: {
      "change select.add-encoder": "addOnChange"
    },

    initialize: function() {
      
      $(this.el).html($("#encoder-list-template").html());
      this.select = this.$("select.add-encoder");

      $("body").append(this.render().el);

      Encoders.bind('add',   this.addOne, this);
      Encoders.bind('reset', this.addAll, this);
      Encoders.bind('all',   this.render, this);
      
      Encoders.fetch();
      
    },

    render: function() {
      var select = this.select;
      select.html(option_template({
        value: "",
        text: selectText
      }));
      _.each(getEncoders(), function(encoder, e) {
        select.append(option_template({
          value: e,
          text: "&nbsp;&nbsp;" + encoder.source + " / " + encoder.name
        }));
      });
      return this;
    },

    addOne: function(encoder) {
      var view = new EncoderView({model: encoder});
      this.$("ul.encoder-list").append(view.render().el);
    },

    addAll: function() {
      Encoders.each(this.addOne);
    },

    addOnChange: function() {
      Encoders.create({
        encoder: this.select.val()*1
      });
      this.select.val(selectText);
    },

  });

  window.EncodersView = new EncoderListView();

});
