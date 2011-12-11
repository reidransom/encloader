$(function() {

  // Use mustache-style templating
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };

  // Python-like path functions
  window.ospath = {
    
    sep: Titanium.Filesystem.getSeparator(),

    basename: function(filename) {
      return _(filename.toString().split(this.sep)).last();
    },

    join: function(list) {
      return list.join(this.sep);
    },

    split: function(filename) {
      filename = filename.toString();
      var i = filename.lastIndexOf(this.sep);
      if (i === -1) {
        return [filename, ""];
      }
      return [filename.slice(0, i), filename.slice(i)];
    },
    
    splitext: function(filename) {
      filename = filename.toString();
      var i = filename.lastIndexOf(".");
      if ((i === -1) || (i < filename.lastIndexOf("/"))) {
        return [filename, ""];
      }
      return [filename.slice(0, i), filename.slice(i)];
    },

  };


  window.random = {
    
    integer: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    string: function(length) {
      var string = "";
      var chars = "_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      while (string.length < length) {
        string += chars[this.integer(0, 62)];
      }
      return string;
    }

  };

  // Simple html tag building
  window.html = {
    
    option: function(value, html) {
      return '<option value="' + value + '">' + html + '</option>';
    }

  };

  var projectRoot = Titanium.App.appURLToPath("app://");

  Titanium.UI.setIcon(Titanium.Filesystem.getFile(projectRoot, "img",
    "encloader.png").toString());
  Titanium.UI.setDockIcon(Titanium.Filesystem.getFile(projectRoot, "img",
    "encloader.icns").toString());

  window.binpath = Titanium.Filesystem.getFile(projectRoot, "bin");
  
  _.each(binpath.getDirectoryListing(), function(file) {
    if (!file.isExecutable()) {
      Titanium.Process.createProcess(
        ["/bin/chmod", "755", file.toString()]
      ).launch();
    }
  });

});
