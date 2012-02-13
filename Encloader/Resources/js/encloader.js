$(function(){

  var JOBS = 3;
  
  // Cache selects
  var select_presets = $("select.encoders");

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
        /*{
          "id": "ekn39s",
          "type": "ENC",
          "name": "Sundance online h.264",
          "cmd": ["ffmpeg", "-i", "{{infile}}", "-threads", "{{threads}}", "-vcodec", "libx264", "-coder", "0", "-flags", "-loop", "-cmp", "+chroma", "-partitions", "-parti8x8-parti4x4-partp8x8-partb8x8", "-me_method", "dia", "-subq", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "0", "-i_qfactor", "0.71", "-b_strategy", "0", "-qcomp", "0.6", "-qmin", "10", "-qmax", "51", "-qdiff", "4", "-bf", "0", "-refs", "1", "-directpred", "1", "-trellis", "0", "-flags2", "-bpyramid-mixed_refs-wpred-dct8x8+fastpskip-mbtree", "-wpredp", "0", "-acodec", "aac", "-ac", "2", "-b:a", "256k", "-r:a", "48k", "-strict", "experimental", "-vf", "yadif,scale=1024:576", "{{outfile}}.mov"],
        },
        {
          "id": "owk93k",
          "type": "ENC",
          "name": "ffmpeg Ultrafast x264",
          "cmd": ["ffmpeg", "-i", "{{infile}}", "-threads", "{{threads}}", "-vcodec", "libx264", "-coder", "0", "-flags", "-loop", "-cmp", "+chroma", "-partitions", "-parti8x8-parti4x4-partp8x8-partb8x8", "-me_method", "dia", "-subq", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "0", "-i_qfactor", "0.71", "-b_strategy", "0", "-qcomp", "0.6", "-qmin", "10", "-qmax", "51", "-qdiff", "4", "-bf", "0", "-refs", "1", "-directpred", "1", "-trellis", "0", "-flags2", "-bpyramid-mixed_refs-wpred-dct8x8+fastpskip-mbtree", "-wpredp", "0", "-acodec", "aac", "-ac", "2", "-b:a", "128k", "-r:a", "48k", "-strict", "experimental", "{{outfile}}.mp4"],
        },*/
        {
          "id": "e8U1qZ",
          "type": "ENC",
          "name": "H.264/AAC HQ 960x540 Deinterlace",
          "cmd": [
            ["ffmpeg", "-i", "{{infile}}", "-crf", "22", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "200", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "256k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", 'yadif,scale=960:540', "-threads", "{{threads}}", "{{outfile}}.mp4"],
            ["qtfaststart.py", "{{outfile}}.mp4"]
          ]
        },
        {
          "id": "k8Ea25",
          "type": "ENC",
          "name": "H.264/AAC 960x540 Deinterlace",
          "cmd": [
            ["ffmpeg", "-i", "{{infile}}", "-crf", "26", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "128k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", 'yadif,scale=960:540', "-threads", "{{threads}}", "{{outfile}}.mp4"],
            ["qtfaststart.py", "{{outfile}}.mp4"]
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
  window.Presets = getPresets();
  
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
  
  var JobView = Class.$extend({

    __init__: function(job) {
      
      this.job = job;
      
      this.percent = 0;
      this.state = "Pending...";
      
      this.el = $(document.createElement("div"));
      this.el.html(this.template({
        title: ospath.basename(this.job.infile),
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
    
    var outfile = [Titanium.Filesystem.getDesktopDirectory().toString()];
    
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
      
      this.view = JobView(this);

      var cmds = Presets[encoder_id].cmd;
      
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
        infile: infile,
        outfile: getOutputFile(infile, xtrapath).toString(),
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
  var initDropzone = function(dropzone) {
    
    window.setInterval(function() {
      var files = dropzone.val();
      if (files) {
        
        // Clear the dropzone value for the next batch of files to be dropped.
        dropzone.val("");

        // Get the currently selected form values.
        var encoder_id = select_presets.val();
        var path = $("#path").val();
        
        // Create a job for each file that was dropped.
        _(files.split("\n")).each(function(file) {
          //var j = Job(file, encoder_id, uploader_id, path);
          var j = NewJob(file, encoder_id, path);
          log.debug(j.killed);
          if (!j.killed) {
            jobq.addJob(j);
          }
        });
        
      }
    }, 500);
  
  };
  initDropzone($("textarea.dropzone"));
  

});
