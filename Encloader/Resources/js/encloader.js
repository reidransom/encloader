if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    var F = function() {};
    F.prototype = o;
    return new F();
  };
}

window.encloader = {
  globalPresetFile: Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDataDirectory(), "global-presets.js"),
  PresetList: {
    init: function() {
      var obj = Object.create(this);
      obj.presets = [];
      obj.el = $("#preset-list");
      obj.updateGlobalPresets();
      obj.addPresetFile(encloader.globalPresetFile);
      return obj;
    },
    append: function(preset) {
      var id = this.presets.length;
      this.presets[id] = preset;
      this.el.append('<option value="' + id + '">' + preset.name + '</option>');
    },
    addPresetObject: function(obj) {
      if (Object.prototype.toString.call(obj) != '[object Array]') {
        if (typeof obj === "object") {
          obj = [obj];
        }
        else {
          // type error
        }
      }
      for (i = 0; i < obj.length; ++i) {
        for (j = 0; j < obj[i].presets.length; j += 1) {
          this.append(obj[i].presets[j]);
        }
      }
    },
    addPresetFile: function(file) {
      var stream, data;
      if (! file.isFile()) {
        Ti.API.warn("Preset file does not exist: " + file);
        return;
      }
      stream = Titanium.Filesystem.getFileStream(file);
      if (stream.open()) {
        data = stream.read(10000);
        data = $.parseJSON($.trim(data));
        this.addPresetObject(data);
      }
      stream.close();
    },
    updateGlobalPresets: function() {
      var data, stream, client;
      client = Ti.Network.createHTTPClient({});
      client.setTimeout(3000);
      client.open("GET", "http://s3.amazonaws.com/rr_media/encloader/global-presets.js", false);
      client.send();
      data = client.responseText;
      if (data && client.status === 200) {
        stream = Ti.Filesystem.getFileStream(encloader.globalPresetFile);
        if (stream.open(Ti.Filesystem.MODE_WRITE)) {
          stream.write(data);
        }
        stream.close();
      }
      else {
        if (! encloader.globalPresetFile.exists()) {
          Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDirectory(), "Resources", "js", "global-presets.js").copy(encloader.globalPresetFile);
        }
      }
    }
  }
}

$(function(){

  encloader.preset_list = encloader.PresetList.init();
  encloader.preset_list.addPresetFile(Titanium.Filesystem.getFile(Titanium.Filesystem.getUserDirectory(), ".encloader", "presets.js"));


  var JOBS = 3;

  // Get bookmarks from ~/.encloader/bookmarks.js
  var getConfig = function(path) {
    var data = {};
    var file = Titanium.Filesystem.getFile(
      Titanium.Filesystem.getUserDirectory(), ".encloader", path
    );
    if (file.isFile()) {
      var stream = Titanium.Filesystem.getFileStream(file);
      if (stream.open()) {
        data = stream.read(10000);
        data = $.parseJSON($.trim(data));
      }
      stream.close();
    }
    return data;
  };

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
      this.el_title_text = this.el.find("a.title-text");

      var jobview = this;

      this.el_kill.click(function() {
        publish("/job/killed", [jobview.job]);
      });

      this.el_title_text.click(function() {
        jobview.el_output.toggle();
      })

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

  var UploadProcess = Class.$extend({

    __init__: function(cmd, job) {
      this.job = job; // todo: change el to job.view
      this.cmd = cmd;
      this.command = this.cmd.join(" ");
      this.el = job.view;
      this.setup();
    },

    setup: function() {
      var p = this;
      this.process = Titanium.Process.createProcess(this.cmd, {
        "PATH": binpath.toString()
      });
      this.process.setOnReadLine(function(data){
        p.el.addOutput(data.toString());
        p.el.setPercent(data.toString() * 1.0);
      });
      this.process.setOnExit(function() {
        p.el.setPercent(100);
        publish("/process/finished", [p]);
      });
    },

    launch: function() {
      this.el.addOutput(this.process.toString());
      this.process.launch();
      this.el.setState("Uploading...");
    },

    kill: function() {
      this.process.kill();
      this.el.setState("Canceled.");
    }

  });

  var FFmpegProcess = Class.$extend({

    __init__: function(cmd, job) {

      this.job = job; // todo: change el to job.view
      this.cmd = cmd;
      this.command = this.cmd.join(" ");
      this.el = job.view;

      this.process = Titanium.Process.createProcess(this.cmd, {
        "PATH": binpath.toString()
      });

      var p = this;
      var duration_re = /Duration: (\d\d):(\d\d):(\d\d)\.(\d\d)/g;
      var duration = 0;
      var time_re = /time=(\d\d):(\d\d):(\d\d)\.(\d\d)/g;
      var qtreffail_re = /error opening alias:/g;
      var qtreffail = false;
      var selfcontained_tempfile = Ti.Filesystem.getFile(Ti.Filesystem.getFile(p.job.tempdir, p.job.tempbase) + '-selfcontained.mov');
      var tcTupleToSeconds = function(tc) {
        return tc[0]*60*60 + tc[1]*60 + tc[2]*1 + tc[3]*.01;
      };

      function ffmbcOnReadLine (data) {
        var line = data.toString();
        p.el.addOutput(line);
        if (qtreffail_re.exec(line)) {
          qtreffail = true;
        }
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
      }

      function ffmbcComplete () {
        // if selfcontained_tempfile exists, delete it
        if (selfcontained_tempfile.exists()) {
          selfcontained_tempfile.deleteFile();
        }
        p.el.setPercent(100);
        publish("/process/finished", [p]);
      }

      this.process.setOnReadLine(ffmbcOnReadLine);

      this.process.setOnExit(function () {
        var selfcontqt_cmd,
            selfcontqt_process,
            tempfile;
        //console.log('[rr] ' + p.process.getExitCode() + ' ' + qtreffail);
        if ((p.process.getExitCode() === 1) && (qtreffail)) {
          p.el.setState("Flattening QT reference...");
          p.el.setPercent(0);
          selfcontqt_cmd = ['selfcontqt', p.job.infile, selfcontained_tempfile];
          selfcontqt_process = Titanium.Process.createProcess(selfcontqt_cmd, {
            "PATH": binpath.toString()
          });
          selfcontqt_process.setOnExit(function () {
            var infile_index = p.cmd.indexOf('-i') + 1;
            p.cmd[infile_index] = selfcontained_tempfile;

            p.process = Titanium.Process.createProcess(p.cmd, {
              "PATH": binpath.toString()
            });

            p.process.setOnReadLine(ffmbcOnReadLine);
            p.process.setOnExit(ffmbcComplete);
            p.launch();
          });
          selfcontqt_process.launch();
        }
        else {
          ffmbcComplete();
        }
      })

    },

    launch: function() {
      Titanium.API.debug(this.command);
      this.el.addOutput(this.process.toString());
      this.process.launch();
      this.el.setState("Encoding...");
    },

    kill: function() {
      this.process.kill();
      this.el.setState("Canceled.");
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

      //var cmds = $.extend(true, [], Presets[encoder_id].cmd);
      var cmds = $.extend(true, [], encloader.preset_list.presets[encoder_id].cmd);

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
        var process = UploadProcess(['EncloaderHelper', outfile, bookmark_id, url], this);
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
  /*
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
  */

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

  /*Titanium.include('basehttp.py');
  basichttp = Titanium.Process.createProcess(['basichttpserver'], {
    "PATH": binpath.toString() + ":/usr/bin:/bin"
  });
  basichttp.setOnReadLine(function(data){
    var s = data.toString();
    Titanium.API.debug("xxx" + s);
    var re = /GET \/encload\/(.+) HTTP\/1\.1/;
    var match = re.exec(s)
    if (match) {
      match = match[1].split('/');
      var bookmark_id = match[0];
      var preset_id = select_presets.val();
      //var preset_id = match[1];
      var url = match.slice(1).join('/');
    }
    if ((bookmark_id) && (preset_id) && (url)) {

      FutureJobView(bookmark_id, preset_id, url);

    }
  });
  basichttp.launch();
  Titanium.API.addEventListener(Titanium.EXIT, function(e) {
    basichttp.kill();
  })*/

  var bookmarks = getConfig('bookmarks.js');
  Titanium.API.debug(bookmarks);

  var validateUploadURL = function(url) {
    if (!url) {
      return [];
    }
    var key = _.find(_.keys(bookmarks), function(k) {
      return (url.indexOf(bookmarks[k]['url']) == 0);
    });
    var path = url.slice(bookmarks[key]['url'].length);
    return [key, path];
  };

  $("#source-file-button").click(function() {
    Titanium.UI.openFileChooserDialog(function(files) {
      if (files.length) {

        var encoder_id = $("#preset-list").val();
        var upload_url = validateUploadURL($("#upload-url-input").val());
        //var combine_av = input_combine_av.is(':checked');
        var path = '';

        if (prefs.multiple == 'combine') {
          // Create a single job combining files that were dropped.
          var j = NewJob(files, encoder_id, path);
          if (upload_url) {
            j.addUpload(upload_url[0], upload_url[1]);
          }
          if (!j.killed) {
            jobq.addJob(j);
          }
        }
        else {
          // Create a job for each file that was dropped.
          _(files).each(function(file) {
            var j = NewJob(file, encoder_id, path);
            if (upload_url) {
              j.addUpload(upload_url[0], upload_url[1]);
            }
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
      this.repos = [];
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
            $('#add-repo-button').click(function() {
              var repo_url = $('#add-repo-url-input').val();
              x.repos.push(repo_url);
              $('#repo-list').append("<p>" + repo_url + "</p>");
            })
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
