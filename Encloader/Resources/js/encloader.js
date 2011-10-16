$(function(){

  // Cache filesystem separator
  var separator = Titanium.Filesystem.getSeparator();

  // Use mustache-style templating
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };

  // Simple html tag building
  var html = {
    
    option: function(value, html) {
      return '<option value="' + value + '">' + html + '</option>';
    }
  
  };

  // Python-like path functions
  var ospath = {
    
    basename: function(filename) {
      return _(filename.split(separator)).last();
    },

    join: function(list) {
      return list.join(separator);
    }

  };

  var random = {
    
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

  var projectRoot = Titanium.App.appURLToPath("app://");
  
  Titanium.UI.setIcon(ospath.join([projectRoot, "img", "encloader-icon.png"]));
  Titanium.UI.setDockIcon(ospath.join([projectRoot, "img", "encloader.icns"]));
  
  var bins = {
    handbrake: ospath.join([projectRoot, "HandBrakeCLI"]),
    ffmbc: ospath.join([projectRoot, "ffmbc"]),
    ffmpeg: ospath.join([projectRoot, "ffmpeg"])
  }
  
  // Cache selects
  var select = {
    encoders: $("select.encoders"),
    uploaders: $("select.uploaders")
  };

  var getPresets = function() {
    
    var presets = {};
    
    // Clear the select elements
    _(select).each(function(s) {
      s.html("");
    });

    // Get preset data from ~/.encloader.js
    var sources = [];
    var stream = Titanium.Filesystem.getFileStream(
      Titanium.Filesystem.getUserDirectory() + separator + ".encloader.js"
    );
    if (stream.open()) {
      var data = stream.read(10000);
      data = $.parseJSON($.trim(data));
      sources = data;
    }
    stream.close();

    // Flatten sources
    var addSource = function(source) {
      _(source.presets).each(function(preset, i) {
        preset["source"] = source.name;
        preset["order"] = i;
        var type = (preset.type === "ENC") ? "encoders" : "uploaders";
        select[type].append(html.option(
          preset.id,
          preset.source + ' / ' + preset.name
        ));
        presets[preset.id] = preset;
      });
    };
    _(sources).each(function(source) {
      if (_.isUndefined(source.name)) {
        $.getJSON(source.url, function(data) {
          _(source).extend(data);
          addSource(source);
        });
      }
      else {
        addSource(source);
      }
    });
    
    // Return a flat object of all the presets
    return presets;
  
  };
  
  // Retrieve presets and render selects
  window.Presets = getPresets();
  
  window.Jobs = [];
  
  var JobBase = Class.$extend({

    __init__: function(title) {
      
      if (title === undefined) title = "";
      
      this.percent = 0;
      this.state = "Pending...";
      this.title = title;
      
      this.el = $(document.createElement("div"));
      this.el.html(this.template({
        title: this.title,
        state: this.state,
        percent: this.percent
      }));
      
      this.el_state = this.el.find("p.state");
      this.el_progress = this.el.find("div.progress-bar div");
    
    },

    template: _.template($("#job-template").html()),

    set: function(attr, val) {
      this[attr] = val;
    },
    
    setPercent: function(val) {
      this.percent = val;
      this.el_progress.css({width: this.percent+"%"});
    },

    setState: function(val) {
      this.state = val;
      this.el_state.html(this.state);
    }
    
  });
  
  /*

    Todo: write a titanium function that executes a command line program.
    Ideally you just pass it a command as a string.  The command could be
    passed directly to python for a non-blocking system call or it could
    be stored in a database to be accessed by a helper program later, like
    helperprogram -j 153, where sqlite job table id 153 is a command...
    or something like that.

  */
  var Job = Class.$extend({
  
    __init__: function(infile, encoder_id, uploader_id, path) {
      
      this.infile = Titanium.Filesystem.getFile(infile);
      this.encoder = Presets[encoder_id];
      this.uploader = Presets[uploader_id];
      this.outfile = this.getAutoOutfile();

      this.xfered = 0;
      this.filesize = 0;

      var outbasename = ospath.basename(this.outfile.toString());
      
      if (!path) {
        path = outbasename;
      }
      this.path = path;
      
      this.job = JobBase(outbasename);
      $("div.jobs").prepend(this.job.el);
      
      this.process = Titanium.Process.createProcess(this.getCmd());
      var rhandbrake = /\d\d?\.\d\d %/g;
      rhandbrake.compile(rhandbrake);
      
      var x = this;
      
      this.process.setOnReadLine(function(data) {
        
        var line = data.toString();
        var percent = rhandbrake.exec(line);
        if (!percent) {
          return;
        }
        percent = percent[0];
        percent = percent.substr(0, percent.length - 2) * 1;
        
        x.job.setPercent(percent);

      });
      
      this.process.setOnExit(function() {
        
        x.job.setPercent(100);
        x.job.setState("Done. (task 1 of 2)");
        
        var upcmd = [
          "curl",
          "-T",
          x.outfile.toString(),
          "ftp://" + encodeURIComponent(x.uploader.user) + 
          ":" + encodeURIComponent(x.uploader.passwd) +
          "@" + x.uploader.host +
          "/" + encodeURIComponent(x.path)
        ];
        
        var upprocess = Titanium.Process.createProcess(upcmd);
        upprocess.setOnReadLine(function(data) {
          var line = data.toString();
          var percent = parseInt(line);
          if (isNaN(percent)) {
            return;
          }
          x.job.setPercent(percent);
        });
        upprocess.setOnExit(function() {
          x.job.setState("Done.");
          x.job.setPercent(100);
        });
        
        x.job.setState("Uploading... (task 2 of 2)");
        upprocess.launch();
      
      });
      
      this.job.setState("Encoding... (task 1 of 2)");
      this.process.launch();
      
    },

    getCmd: function() {
      var cmd = this.encoder.cmd.split(" ");
      cmd[0] = bins.handbrake;
      cmd[2] = this.infile.toString();
      cmd[4] = this.outfile.toString();
      return cmd;
    },

    getAutoOutfile: function() {
      var desktop = Titanium.Filesystem.getDesktopDirectory();
      var basename = _(this.infile.toString().split(separator)).last();
      basename = basename.substring(
        0, basename.length - this.infile.extension().length - 1
      );
      var outfile = Titanium.Filesystem.getFile(
        desktop, basename + "." + this.encoder.extension
      );
      var i = 1;
      while (outfile.exists()) {
        outfile = Titanium.Filesystem.getFile(
          desktop, basename + "-" + i + "." + this.encoder.extension
        );
        i = i + 1;
      }
      return outfile;
    }
  
  });

  
  // Wait for files to be dropped on the dropzone
  var initDropzone = function(dropzone) {
  
    window.setInterval(function() {
      var files = dropzone.val();
      if (files) {
        dropzone.val("");
        var encoder_id = select.encoders.val();
        var uploader_id = select.uploaders.val();
        var path = $("#path").val();
        _(files.split("\n")).each(function(file) {
          Jobs.push(Job(file, encoder_id, uploader_id, path));
        });
      }
    }, 500);
  
  };
  
  initDropzone($("textarea.dropzone"));
  

  
  
});

