$(function(){

  var JOBS = 3;

  // Cache selects
  var select_presets = $("select.encoders"); // browser
  //var input_combine_av = $("input.combine_av");

  var getPresets = function() {
    
    var presets = {};
    
    // Clear the select elements
    select_presets.html("");

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
          "id": "e8U1qZ",
          "type": "ENC",
          "name": "H.264 720p",
          "cmd": [
            "ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "25", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-strict", "experimental", "-vf", 'yadif,scale=1280:720', "{{outfile}}-720p.mp4"
          ]
        },
        {
          "id": "k8Ea25",
          "type": "ENC",
          "name": "H.264 Mobile",
          "cmd": [
            ["ffmpeg", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "25", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "192k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", 'yadif,scale=640:360', "-threads", "{{threads}}", "{{outfile}}-mobile.mp4"],
            ["qtfaststart.py", "{{outfile}}-mobile.mp4"]
          ]
        },
        {
          "id": "8wI2L9",
          "type": "ENC",
          "name": "Animation",
          "cmd": ["ffmpeg", "-i", "{{infile}}", "-vcodec", "qtrle", "-g", "1", "-acodec", "pcm_s16le", "{{outfile}}-animation.mov"
          ]
        },
        {
          "id": "EVLijw",
          "type": "ENC",
          "name": "ProRes",
          "cmd": ["ffmpeg", "-i", "{{infile}}", "-vcodec", "prores", "-profile", "2", "-acodec", "pcm_s16le", "{{outfile}}-prores.mov"
          ]
        },
        {
          "id": "8Z4XWc",
          "type": "ENC",
          "name": "ProRes HQ",
          "cmd": ["ffmpeg", "-i", "{{infile}}", "-vcodec", "prores", "-profile", "3", "-acodec", "pcm_s16le", "{{outfile}}-proreshq.mov"
          ]
        },
        {
          "id": "zIs82L",
          "type": "ENC",
          "name": "5D to DNx175 MXF",
          "cmd": [
            ["ffmpeg", "-i", "{{infile}}", "-vcodec", "dnxhd", "-b:v", "175M", "-pix_fmt", "yuv422p", "-s", "1920x1080", "-acodec", "pcm_s16le", "-ar", "48000", "-ac", "2", "-threads", "{{threads}}", "-vf", "crop=in_w:in_h-8:0:0,scale=1920:1080", "{{tempfile}}.mov"],
            ["ffmpeg", "-i", "{{tempfile}}.mov", "-an", "-vcodec", "copy", "{{tempfile}}.m2v"],
            ["ffmpeg", "-i", "{{tempfile}}.mov", "-vn", "-acodec", "pcm_s16le", "{{tempfile}}.wav"],
            ["writeavidmxf", "--prefix", "{{outfile}}", "--film23.976", "--DNxHD1080p175", "{{tempfile}}.m2v", "--wavpcm", "{{tempfile}}.wav"]
          ],
        }
      ]
    });

    // Flatten sources
    var addSource = function(source) {
      _(source.presets).each(function(preset, i) {
        preset["source"] = source.name;
        preset["order"] = i;
        select_presets.append(html.option(
          preset.id,
          preset.name
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
  window.Presets = getPresets(); // browser
  
  var JobQueue = Class.$extend({
  
    __init__: function() {
      this.queue = [];
      this.finished = 0;
      this.working = 0;
      this.max_working = 3;
    },

    addJob: function(job) {
      this.queue.push(job);
      if (this.working < this.max_working) {
        job.launch();
        this.working++;
      }
    }
  
  });
  var jobq = JobQueue([]);
  
  // browser
  var JobView = Class.$extend({

    __init__: function(job) {
      
      this.job = job;
      
      this.percent = 0;
      this.state = "Pending...";
      
      this.el = $(document.createElement("div"));
      this.el.html(this.template({
        //title: ospath.basename(this.job.infile),
        title: this.job.outfile,
        state: this.state,
        percent: this.percent
      }));
      
      this.el_state = this.el.find("p.state");
      this.el_progress = this.el.find("div.progress-bar div");
      this.el_output = this.el.find("div.output");
      this.el_kill = this.el.find("a.close");

      var jobview = this;
      this.el_kill.click(function() {
        publish("/job/killed", [jobview.job]);
      });
      
      $("div.jobs").prepend(this.el);
    
    },

    template: _.template($("#job-template").html()),

    set: function(attr, val) {
      this[attr] = val;
    },
    
    setPercent: function(val) {
      this.percent = val;
      this.el_progress.css({width: this.percent+"%"});
      if (this.percent == 100) {
        this.setState("Done.");
      }
    },

    setState: function(val) {
      this.state = val;
      this.el_state.html(this.state);
    },

    startUnknown: function() {
      this.setPercent(0);
    },

    endUnknown: function() {
      this.setPercent(100);
    },

    addOutput: function(line) {
      this.el_output.append(line + "<br />");
      this.el_output[0].scrollTop = this.el_output[0].scrollHeight;
    }
    
  });
  
      
  var LinkedList = Class.$extend({
  
    __init__: function() {
      this.length = 0;
      this.first = null;
      this.last = null;
    },

    append: function(node) {
      node.next = null;
      if (this.first === null) {
        this.first = node;
        this.last = node;
      }
      else {
        this.last.next = node;
        this.last = node;
      }
      this.length++;
    }
  
  });
  
  var ProcessBase = Class.$extend({
    
    __init__: function(cmd, job) {
      this.job = job; // todo: change el to job.view
      this.command = cmd.join(" ");
      this.process = Titanium.Process.createProcess(cmd, {
        "PATH": binpath.toString() + ":/usr/bin:/bin"
      });
      this.el = job.view;
      var p = this;
      this.process.setOnReadLine(function(data){
        p.el.addOutput(data.toString());
      });
      this.process.setOnExit(function() {
        p.el.setPercent(100);
        publish("/process/finished", [p]);
      });
    },

    launch: function() {
      Titanium.API.debug(this.command);
      this.el.addOutput(this.process.toString());
      this.process.launch();
      this.el.setState("Running...");
    },

    kill: function() {
      this.process.kill();
      this.el.setState("Canceled.");
    }

  });

  var FFmpegProcess = ProcessBase.$extend({
    
    __init__: function(cmd, job) {
      
      this.$super(cmd, job);
      
      var p = this;
      var duration_re = /Duration: (\d\d):(\d\d):(\d\d)\.(\d\d)/g;
      var duration = 0;
      var time_re = /time=(\d\d):(\d\d):(\d\d)\.(\d\d)/g;
      var tcTupleToSeconds = function(tc) {
        return tc[0]*60*60 + tc[1]*60 + tc[2]*1 + tc[3]*.01;
      };
      this.process.setOnReadLine(function(data){
        var line = data.toString();
        //Titanium.API.debug(line);
        p.el.addOutput(line);
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
            p.el.setPercent(secs / duration * 100);
          }
        }
      });
    
    }
  
  });
  // todo: register this process type
  
  // Returns Titanium.Filesystem.File outfile
  var getOutputFile = function(infile, xtrapath) {
    
    //var outfile = [Titanium.Filesystem.getDesktopDirectory().toString()];
    var outfile = [prefs.output_folder];
    
    if (xtrapath) {
      outfile.push(xtrapath);
    }
    
    // If no basename is specified, use the input file basename.
    if ((!xtrapath) || (xtrapath.slice(-1) == '/')) {
      // Remove the file extension.
      infile = infile.slice(0, infile.lastIndexOf("."));
      outfile.push(ospath.basename(infile));
    }
    
    outfile = Titanium.Filesystem.getFile(outfile);
    return outfile;
  
  };
      
  var mapTemplate = function(list, context) {
    // Substitute placeholders in command arguments
    return _.map(list, function(item) {
      return _.template(item)(context);
    });
  }

  var NewJob = LinkedList.$extend({
  
    __init__: function(infile, encoder_id, xtrapath) {
      
      // A job is a list of processes
      this.$super();
      
      this.infile = infile;
      
      var outfile = "";
      if (typeof(infile) != 'string') {
        // Assume infile is a list of files
        outfile = getOutputFile(infile[0], xtrapath).toString();
      }
      else {
        outfile = getOutputFile(infile, xtrapath).toString();
      }
      this.outfile = outfile;
      
      this.view = JobView(this);

      var cmds = $.extend(true, [], Presets[encoder_id].cmd);

      // Killed flag
      this.killed = 0;
      
      // Incase there is only one command, make a list of one command anyway.
      if (typeof(cmds[0]) === "string") {
        cmds = [cmds];
      }
      
      // Create argument subsitution variables.
      this.tempdir = Titanium.Filesystem.getApplicationDataDirectory();
      this.tempbase = random.string(6);
      subs = {
        infile: this.infile,
        outfile: outfile,
        threads: Titanium.Platform.getProcessorCount() + "",
        tempfile: Titanium.Filesystem.getFile(this.tempdir, this.tempbase)
      };
      
      // Get the outfiles and tempfiles
      this.outfiles = [];
      this.tempfiles = [];
      _.each(_.flatten(cmds), function(arg) {
        // todo: make the actual subsitutions here as well
        if (arg.match(/{{outfile}}/)) {
          this.outfiles.push(_.template(arg)(subs));
        }
        if (arg.match(/{{tempfile}}/)) {
          this.tempfiles.push(_.template(arg)(subs));
        }
      }, this);
      this.outfiles = _.uniq(this.outfiles);
      this.tempfiles = _.uniq(this.tempfiles);
      
      // Make sure these files don't already exist.
      _.each(this.outfiles.concat(this.tempfiles), function(file) {
        file = Titanium.Filesystem.getFile(file);
        if (file.exists()) {
          this.view.setState("File already exists: " + file.toString());
          this.killed = 1;
        }
        // todo: check against other files to be created during the batch.
      }, this);

      
      // When combining files, pass them all with -i.
      if (typeof(infile) != "string") {
        
        var infileargs = [];
        _.each(infile, function(f) {
          infileargs.push(f);
          infileargs.push("-i");
        });
        infile = infileargs.slice(0, -1);
        
        var len = cmds.length;
        for (var i=0; i<len; i++) {
          if (cmds[i][0] in {"ffmpeg":"", "ffmbc":""}) {
            var n = _(cmds[i]).indexOf("{{infile}}");
            cmds[i].splice(n, 1, infile); 
            cmds[i] = _.flatten(cmds[i]);
          }
        }
      }
      
      // Subsitute the arguments.
      cmds = _.map(cmds, function(cmd) {
        return mapTemplate(cmd, subs);
      });

      // Add each process to this job
      for (var i=0; i<cmds.length; i++) {
        var process = FFmpegProcess(cmds[i], this);
        this.append(process);
      }

      // There is no currently running process
      this.current = null;

    },

    addUpload: function(bookmark_id, url) {
      // todo: if there are multiple output files, check that url is a directory
      _.each(this.outfiles, function(outfile) {
        Titanium.API.debug(outfile);
        var process = FFmpegProcess(['encloaderupload', outfile, bookmark_id, url], this); //INSECURE!!!
        this.append(process);
      }, this);
    },

    launch: function() {
      this.current = this.first;
      this.first.launch();
    }

  });
  
  subscribe("/job/killed", function(job) {
    job.killed = 1;
    job.view.setState("Cancelled.");
    job.current.kill();
  });
  
  subscribe("/job/finished", function(jq) {
    jq.finished++;
    jq.working--;
    var i = jq.finished + jq.working;
    if (jq.queue.length > i) {
      jq.queue[i].launch();
      jq.working++;
    }
  });

  subscribe("/process/finished", function(process) {
    
    // If there is another process to run... launch it.
    if ((process.next) && (!process.job.killed)) {
      process.current = process.next;
      process.next.launch();
    }
    
    else {
      
      // There are no more currently running processes.
      process.current = null;
      
      // Remove tempfiles
      _.each(process.job.tempfiles, function(file) {
        file.deleteFile();
      });
      
      // Let the job queue know this finished
      publish("/job/finished", [jobq]);
    
    }
  });

  // Wait for files to be dropped on the dropzone
  // browser
  var initDropzone = function(dropzone) {
    
    window.setInterval(function() {
      var files = dropzone.val();
      if (files) {
        
        // Clear the dropzone value for the next batch of files to be dropped.
        dropzone.val("");

        // Get the currently selected form values.
        var encoder_id = select_presets.val();

        // Get combine_av checkbox value.
        //var combine_av = input_combine_av.is(':checked');
        
        // Removed the path input for interface simplification.
        // Perhaps it will be re-enabled later or made optional in settings.
        //var path = $("#path").val();
        var path = "";
        
        if (prefs.multiple == 'combine') {
          // Create a single job combining files that were dropped.
          var j = NewJob(files.split("\n"), encoder_id, path);
          if (!j.killed) {
            jobq.addJob(j);
          }
        }
        else {
          // Create a job for each file that was dropped.
          _(files.split("\n")).each(function(file) {
            var j = NewJob(file, encoder_id, path);
            if (!j.killed) {
              jobq.addJob(j);
            }
          });
        }
          
      }
    }, 500);
  
  };
  initDropzone($("textarea.dropzone"));

  var FutureJobView = Class.$extend({
  
    __init__: function(bookmark_id, preset_id, url) {
      this.bookmark_id = bookmark_id;
      this.preset_id = preset_id;
      this.url = url;
      
      this.el = $(document.createElement("div"));
      this.el.html(this.template({url: this.url}));

      this.el_file = this.el.find("input.source-file-button");
      
      var x = this;
      this.el_file.click(function() {
        Titanium.UI.openFileChooserDialog(function(f) {
          x.el.remove();
          if (f.length == 1) {
            f = f[0];
          }
          var j = NewJob(f, preset_id, "");
          j.addUpload(x.bookmark_id, x.url);
          if (!j.killed) {
            jobq.addJob(j);
          }
        }, {multiple:true});
      });
      
      $("div.jobs").prepend(this.el);

    },
    
    template: _.template($("#future-job-template").html())
  
  });
  
  basichttp = Titanium.Process.createProcess(['basichttpserver'], {
    "PATH": binpath.toString() + ":/usr/bin:/bin"
  });
  basichttp.setOnReadLine(function(data){
    var s = data.toString();
    var re = /GET \/encload\/(.+) HTTP\/1\.1/;
    var match = re.exec(s)
    if (match) {
      match = match[1].split('/');
      var bookmark_id = match[0];
      var preset_id = match[1];
      var url = match.slice(2).join('/');
    }
    if ((bookmark_id) && (preset_id) && (url)) {

      FutureJobView(bookmark_id, preset_id, url);
      
    }
  });
  basichttp.launch();
  Titanium.API.addEventListener(Titanium.EXIT, function(e) {
    basichttp.kill();
  })

  $("#source-file-button").click(function() {
    Titanium.UI.openFileChooserDialog(function(files) {
      if (files.length) {

        var encoder_id = select_presets.val();
        //var combine_av = input_combine_av.is(':checked');
        var path = '';

        if (prefs.multiple == 'combine') {
          // Create a single job combining files that were dropped.
          var j = NewJob(files, encoder_id, path);
          if (!j.killed) {
            jobq.addJob(j);
          }
        }
        else {
          // Create a job for each file that was dropped.
          _(files).each(function(file) {
            var j = NewJob(file, encoder_id, path);
            if (!j.killed) {
              jobq.addJob(j);
            }
          });
        }

      }
    }, {multiple:true});
  });

  Shadowbox.init({
    skipSetup: true
  });
  
  var openBox = function(template, subs, options) {
    Shadowbox.open({
      content: _.template(template)(subs),
      player: 'html',
      width: 500,
      height: 400,
      options: options
    });
  }
  
  var Preferences = Class.$extend({
  
    __init__: function() {
      this.multiple = 'separate';
      this.output_folder = Titanium.Filesystem.getDesktopDirectory().toString();
      var x = this;
      $("#preferences-icon").click(function() {
        var checked = ' checked="checked"';
        openBox($("#preferences-template").html(), {
          output_folder: x.output_folder,
          multi_separate: (x.multiple == 'separate') ? checked : '',
          multi_combine: (x.multiple == 'combine') ? checked : ''
        }, {
          onFinish: function() {
            $('#output-folder-button').click(function() {
              Titanium.UI.openFolderChooserDialog(function(files) {
                if (files.length) {
                  x.setOutputFolder(files[0]);
                }
              }, {multiple:false});
            });
            $('input:radio[name=multiple-pref]').change(function() {
              var val = $('input:radio[name=multiple-pref]:checked').val();
              x.setMultiple(val);
            });
          }
        });
      });
    },

    setOutputFolder: function(path) {
      this.output_folder = path;
      $("#output-folder-span").html(path);
    },

    setMultiple: function(val) {
      this.multiple = val;
    }

  });
  window.prefs = Preferences();
  
});
