// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  var selectText = "Choose:";
  
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
  var encoders = getEncoders();

  var getUploaders = function() {
    var uploaders = [];
    _.each(sources, function(source) {
      _.each(source.uploaders, function(uploader) {
        uploaders.push(_.extend(uploader, {source: source.name}));
      });
    });
    return uploaders;
  };
  var uploaders = getUploaders();

  // this should go inside a View but for now since this stuff is only done
  // once the app is started, this will suffice
  var initApp = function() {
    var template = _.template($('#option-template').html());
    _.each(encoders, function(encoder, e) {
      $("#add-encoder").append(template({
        value: e,
        text: "&nbsp;&nbsp;" + encoder.source + " / " + encoder.name
      }));
    });
  };
  initApp();
  
  // Todo Model
  // ----------

  // Our basic **Todo** model has `content`, `order`, and `done` attributes.
  window.Todo = Backbone.Model.extend({

    // Default attributes for the todo.
    defaults: {
      done: false,
      encoder: encoders[0],
      uploaders: uploaders[0]
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("encoder")) {
        this.set({"encoder": this.defaults.encoder});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  window.TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Save all of the todo items under the `"todos"` namespace.
    localStorage: new Store("todos"),

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Create our global collection of **Todos**.
  window.Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  window.TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .check"              : "toggleDone",
      "click span.todo-destroy"   : "clear",
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(_.extend(
        this.model.toJSON(), {availUploaders: uploaders}
      )));
      this.setContent();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the todo item.
    setContent: function() {
      var encoder = this.model.get('encoder');
      this.$('.todo-content').text(encoder.name);
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
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

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  window.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .todo-clear a": "clearCompleted",
      "change #add-encoder": "addOnChange",
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {
      this.select = this.$("#add-encoder");

      Todos.bind('add',   this.addOne, this);
      Todos.bind('reset', this.addAll, this);
      Todos.bind('all',   this.render, this);

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.$('#todo-stats').html(this.statsTemplate({
        total:      Todos.length,
        done:       Todos.done().length,
        remaining:  Todos.remaining().length
      }));
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne);
    },

    // Generate the attributes for a new Todo item.
    newAttributes: function() {
      return {
        order:   Todos.nextOrder(),
        done:    false,
        encoder: encoders[this.select.val()*1]
      };
    },

    // Create a new Todo and reset the encoder select
    addOnChange: function() {
      Todos.create(this.newAttributes());
      this.select.val(selectText);
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.destroy(); });
      return false;
    },

  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

});
