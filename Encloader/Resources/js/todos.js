$(function(){

  Jaml.register("option", function(text) {
    option(text);
  });
  Jaml.register("preset-option", function(preset) {
    option({value: preset.id},
      "&nbsp;&nbsp;" + preset.source + " / " + preset.name
    );
  });
  Jaml.register("preset", function(preset) {
    div(preset.source + " / " + preset.name);
  });
  Jaml.register("uploader", function(uploader) {
    li(
      Jaml.render("preset", uploader),
      span({cls: "destroy uploader"})
    )
  });

  var OrderedList = Backbone.Collection.extend({

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(todo) {
      return todo.get('order');
    },
  
  });

  var PresetList = OrderedList.extend({
    
    asOptions: function() {
      html = Jaml.render("option", "Choose:");
      html += Jaml.render("preset-option", this.toJSON());
      return html;
    }
  
  });


  var getSources = function() {
    var sources = [];
    if (1) {
      sources = [
        {
          name: "Local",
          encoders: [
            {
              id: "d1987e6e-3159-94d3-d661-d1bc3f0af16a",
              name: "Web Post (HD)",
              cmd: "HandbrakeCLI make HD video",
              extension: ".mp4"
            },
            {
              id: "c809a3df-174e-cb6f-edac-ae4d53a7a1d2",
              name: "Web Post (SD)",
              cmd: "Handbrake CLI make SD video",
              extension: ".mp4"
            }
          ],
          uploaders: [
            {
              id: "ae52faea-ec4f-e9f1-0926-a48e63671212",
              name: "Desktop",
              path: "~/Desktop"
            },
            {
              id: "c175332e-4aff-4f76-21b4-3fa71e82c73a",
              name: "Example FTP",
              host: "ftp.example.com",
              user: "username",
              passwd: "password"
            },
            {
              id: "67ff87f9-0fcb-f6f7-4437-75dfeef263bf",
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
  
  var getPresets = function(presetType) {
    var presets = new PresetList;
    _.each(sources, function(source) {
      _.each(source[presetType], function(preset) {
        presets.add(_.extend(preset, {
          source: source.name,
          order: presets.nextOrder()
        }));
      });
    });
    return presets;
  };


  
  window.AvailableEncoders = getPresets("encoders");
  window.AvailableUploaders = getPresets("uploaders");


  
  
  // EncoderList Collection
  // ---------------

  window.EncoderList = OrderedList.extend({

    localStorage: new Store("encoders")

  });


  window.UploaderView = Backbone.View.extend({
    
    tagName: "li",
    
    events: {
      "click span.destroy.uploader" : "clear",
    },
    
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind("destroy", this.remove, this);
    },
    
    render: function() {
      var uploader = AvailableUploaders.get(this.model.get("uploader"));
      Jaml.render("uploader", uploader.toJSON())
    },
  
    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.destroy();
    },

  });

  
  // Encoder View
  // ------------

  window.EncoderView = Backbone.View.extend({

    tagName:  "li",

    template: _.template($('#encoder-template').html()),
    
    events: {
      "click span.destroy.encoder" : "clear",
      "change select.add-uploader": "addUploader"
    },

    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    select: function() {
      return this.$("select.add-uploader");
    },
    
    render: function() {
      
      var encoder = AvailableEncoders.get(this.model.get("encoder"));
      $(this.el).html(this.template(encoder.toJSON()));
      
      this.select().html(AvailableUploaders.asOptions());

      this.$("ul.uploader-list").html(
        Jaml.render("uploader", _.map(this.model.get("uploaders"), function(u) {
          return AvailableUploaders.get(u).toJSON();
        }))
      );

      return this;

    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.destroy();
    },

    addUploader: function() {
      
      var id = this.select().val();

      var uploaders = this.model.get("uploaders");
      uploaders.push(id);
      this.model.save({uploaders: uploaders});

      this.render();
      
      this.select().val(0);
      
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

      this.collection.bind('add',   this.addOne, this);
      this.collection.bind('reset', this.addAll, this);
      this.collection.bind('all',   this.render, this);
      
      this.collection.fetch();
      
    },

    render: function() {
      this.select.html(AvailableEncoders.asOptions());
      return this;
    },

    addOne: function(encoder) {
      var view = new EncoderView({model: encoder});
      this.$("ul.encoder-list").append(view.render().el);
    },

    addAll: function() {
      this.collection.each(this.addOne);
    },

    addOnChange: function() {
      this.collection.create({
        encoder: this.select.val(),
        uploaders: [],
        order: this.collection.nextOrder()
      });
      this.select.val(0);
    },

  });

  window.EncodersView = new EncoderListView({collection:new EncoderList});

});
