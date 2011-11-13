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
      return _(filename.toString().split(separator)).last();
    },

    join: function(list) {
      return list.join(separator);
    },

    split: function(filename) {
      filename = filename.toString();
      var i = filename.lastIndexOf(separator);
      if (i === -1) {
        return [filename, ""];
      }
      return [filename.slice(0, i), filename.slice(i)];
    },
    
    splitext: function(filename) {
      filename = filename.toString();
      var i = filename.lastIndexOf(".");
      if ((i === -1) || (i < filename.lastIndexOf("/"))) {
        // There is no file extension
        return [filename, ""];
      }
      return [filename.slice(0, i), filename.slice(i)];
    },

    tempDir: Titanium.Filesystem.createTempDirectory()

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
      
  var getNewFile = function(path) {
    var rootext = ospath.splitext(path.toString());
    var outfile = Titanium.Filesystem.getFile(path);
    var i = 1;
    while (outfile.exists()) {
      outfile = Titanium.Filesystem.getFile(
        rootext[0] + "-" + i + rootext[1]
      );
      i = i + 1;
    }
    return outfile;
  }

  var projectRoot = Titanium.App.appURLToPath("app://");
  
  Titanium.UI.setIcon(Titanium.Filesystem.getFile(projectRoot, "img",
    "encloader.png").toString());
  Titanium.UI.setDockIcon(Titanium.Filesystem.getFile(projectRoot, "img",
    "encloader.icns").toString());
  
  var binpath = Titanium.Filesystem.getFile(projectRoot, "bin");
  var bins = {
    handbrake: Titanium.Filesystem.getFile(projectRoot, "bin", "HandBrakeCLI"),
    ffmpeg: Titanium.Filesystem.getFile(projectRoot, "bin", "ffmpeg"),
    ffmpegfs: Titanium.Filesystem.getFile(projectRoot, "bin", "ffmpegfs"),
    qtfaststart: Titanium.Filesystem.getFile(projectRoot, "bin", "qtfaststart.py")
  };
  _.each(_.values(bins), function(bin) {
    if (!bin.isExecutable()) {
      Titanium.Process.createProcess(["/bin/chmod", "755", bin.toString()]).launch();
    }
  });
  
  // Cache selects
  var select = {
    encoders: $("select.encoders"),
    uploaders: $("select.uploaders")
  };

  var getPresets = function() {
    
    var presets = {
    };
      
    
    // Clear the select elements
    _(select).each(function(s) {
      s.html("");
    });

    var sources = [];
    
    // Get preset data from ~/.encloader/presets.js
    var presetFile = Titanium.Filesystem.getFile(
      Titanium.Filesystem.getUserDirectory(), ".encloader", "presets.js"
    );
    if (presetFile.isFile()) {
      var stream = Titanium.Filesystem.getFileStream(presetFile);
      if (stream.open()) {
        var data = stream.read(10000);
        data = $.parseJSON($.trim(data));
        sources = data;
      }
      stream.close();
    }
  
    sources.unshift({
      "name": "Built-in",
      "presets": [
        {
          "id": "kej83J",
          "type": "MV",
          "name": "Desktop",
          "path": Titanium.Filesystem.getFile(
            Titanium.Filesystem.getDesktopDirectory()
          )
        },
        {
          "id": "owk93k",
          "type": "ENC",
          "name": "x264 Ultrafast",
          "cmd": "{{ffmpegfs}} -i {{infile}} -threads {{threads}} -vcodec libx264 -fpre {{ffpresets}}libx264-ultrafast.ffpreset -strict experimental -filter yadif -y {{outfile}}",
          "extension": "mp4"
        },
        {
          "id": "lI3Us0",
          "type": "ENC",
          "name": "x264 HQ",
          "cmd": "{{ffmpegfs}} -i {{infile}} -threads {{threads}} -vcodec libx264 -fpre {{ffpresets}}libx264-hq.ffpreset -strict experimental -filter yadif -y {{outfile}}",
          "extension": "mp4"
        },
        {
          "id": "lI3Us0",
          "type": "ENC",
          "name": "x264 iphone",
          "cmd": "{{ffmpegfs}} -i {{infile}} -threads {{threads}} -vcodec libx264 -fpre {{ffpresets}}libx264-iphone.ffpreset -strict experimental -filter yadif -s 640x360 -y {{outfile}}",
          "extension": "mp4"
        }
      ]
    });

    // Flatten sources
    var addSource = function(source) {
      _(source.presets).each(function(preset, i) {
        preset["source"] = source.name;
        preset["order"] = i;
        var type = (preset.type === "ENC") ? "encoders" : "uploaders";
        select[type].append(html.option(
          preset.id,
          /*preset.source + ' / ' +*/ preset.name
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
      this.xfered = 0;
      this.filesize = 0;

      // this is where files get encoded to by default, it should be user-definable.
      var defaultpath = Titanium.Filesystem.getDesktopDirectory();
      
      var xtrapath = path;
      var localpath = "";
      var uppath = "";
      
      if (this.uploader.hasOwnProperty("host")) {
        // uploader is an FTP
        var uppath = "";
        if (this.uploader.hasOwnProperty("path")) {
          uppath = this.uploader.path;
        }
        if (xtrapath) {
          if (xtrapath.slice(-1) === "/") {
            // xtrapath is a directory
            localpath = Titanium.Filesystem.getFile(defaultpath,
              ospath.basename(infile));
            uppath = uppath + xtrapath + ospath.basename(infile);
          }
          else {
            // xtrapath is a file
            localpath = Titanium.Filesystem.getFile(defaultpath,
              ospath.basename(xtrapath));
            uppath = uppath + xtrapath;
          }
        }
        else {
          // no xtrapath
          localpath = Titanium.Filesystem.getFile(defaultpath,
            ospath.basename(infile));
          uppath = uppath + ospath.basename(infile);
        }
      }
      else {
        // uploader is a local MV
        if (xtrapath) {
          if (xtrapath.charAt(xtrapath.length - 1) == '/') {
            localpath = Titanium.Filesystem.getFile(this.uploader.path, xtrapath,
              ospath.basename(infile));
          }
          else {
            localpath = Titanium.Filesystem.getFile(this.uploader.path, xtrapath);
          }
        }
        else {
          localpath = Titanium.Filesystem.getFile(this.uploader.path,
            ospath.basename(infile));
        }
      }

      if (ospath.splitext(localpath)[1].slice(1) != this.encoder.extension) {
        //localpath = Titanium.Filesystem.getFile(ospath.splitext(localpath)[0] +
        //  "." + this.encoder.extension);
        localpath = Titanium.Filesystem.getFile(localpath.toString() + "." +
          this.encoder.extension);
        if (uppath) {
          uppath = ospath.splitext(uppath)[0] + "." + this.encoder.extension;
        }
      }

      this.job = JobBase(ospath.basename(localpath));
      $("div.jobs").prepend(this.job.el);
      
      
      // Check if files already exist
      // todo: check if remote file exists
      if (localpath.exists()) {
        this.job.setState("File already exists.");
        return;
      }


      // Check if target directory actually exists
      // todo: check if target remote directory actually exists
      if (!Titanium.Filesystem.getFile(ospath.split(localpath)[0]).isDirectory()) {
        this.job.setState("Folder does not exist.");
        return;
      }
      
      
      var enccmd = this.encoder.cmd.split(" ");
      var ffpresets = Titanium.Filesystem.getFile(projectRoot,
        "ffpresets").toString() + separator;
      var infile = this.infile;
      var bin = "handbrake";
      _.each(enccmd, function(param, i) {
        enccmd[i] = param.replace("{{ffpresets}}", ffpresets);
        if (param === "{{handbrake}}") {
          enccmd[i] = bins.handbrake;
        }
        else if (param === "{{ffmpeg}}") {
          enccmd[i] = bins.ffmpeg;
          bin = "ffmpeg";
        }
        else if (param === "{{ffmpegfs}}") {
          enccmd[i] = "ffmpegfs";
          bin = "ffmpeg";
        }
        else if (param === "{{qtfaststart}}") {
          enccmd[i] = bins.qtfaststart;
        }
        else if (param === "{{infile}}") {
          enccmd[i] = infile.toString();
        }
        else if (param === "{{outfile}}") {
          enccmd[i] = localpath.toString();
        }
        else if (param === "{{threads}}") {
          enccmd[i] = Titanium.Platform.getProcessorCount() + "";
        }
      });

      log.debug(enccmd);
      this.process = Titanium.Process.createProcess(enccmd, {
        'PATH': binpath.toString() + ":/usr/bin:/bin"
      });
      
      var x = this;
      
      if (bin === "handbrake") {
        
        var rhandbrake = /\d\d?\.\d\d %/g;
        rhandbrake.compile(rhandbrake);
        
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
      
      }
      else if (bin === "ffmpeg") {
        var duration_re = /Duration: (\d\d):(\d\d):(\d\d)\.(\d\d)/g;
        var duration = 0;
        var time_re = /time=(\d\d):(\d\d):(\d\d)\.(\d\d)/g;
        var tcTupleToSeconds = function(tc) {
          return tc[0]*60*60 + tc[1]*60 + tc[2]*1 + tc[3]*.01;
        };
        this.process.setOnReadLine(function(data) {
          var line = data.toString();
          log.debug(line);
          if (!duration) {
            var match = duration_re.exec(line);
            if (match) {
              duration = tcTupleToSeconds(match.slice(1));
            }
          }
          else {
            var match = time_re.exec(line);
            if (match) {
              var secs = tcTupleToSeconds(match.slice(1));
              x.job.setPercent(secs / duration * 100);
            }
          }
        });
      }
      
      this.process.setOnExit(function() {
        
        x.job.setPercent(100);
        if (x.uploader.type === "MV") {
          x.job.setState("Done.");
          return;
        }
        x.job.setState("Done. (task 1 of 2)");
        
        var upcmd = [
          "curl",
          "-T",
          localpath.toString(),
          "ftp://" + encodeURIComponent(x.uploader.user) + 
          ":" + encodeURIComponent(x.uploader.passwd) +
          "@" + x.uploader.host +
          "/" + encodeURIComponent(uppath)
        ];
        
        var upprocess = Titanium.Process.createProcess(upcmd);
        upprocess.setOnReadLine(function(data) {
          var line = data.toString();
          var percent = parseInt(line);
          if (isNaN(percent)) {
            return;
          }
          if (x.job.percent < percent) {
            x.job.setPercent(percent);
          }
        });
        upprocess.setOnExit(function() {
          x.job.setState("Done.");
          x.job.setPercent(100);
        });
        
        x.job.setState("Uploading... (task 2 of 2)");
        x.job.setPercent(0);
        upprocess.launch();
      
      });
      
      if (x.uploader.type === "MV") {
        this.job.setState("Encoding...");
      }
      else {
        this.job.setState("Encoding... (task 1 of 2)");
      }
      this.process.launch();
      
    },

    getAutoOutfile: function(path) {
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
