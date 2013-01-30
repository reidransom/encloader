[
  {
    "name": "My Presets",
    "presets": [
      {
        "name": "Animation",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "qtrle", "-g", "1", "-acodec", "pcm_s16le", "{{outfile}}-animation.mov"]
      },
      {
        "name": "ProRes",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "prores", "-profile", "std", "-acodec", "pcm_s16le", "{{outfile}}-prores.mov"]
      },
      {
        "name": "ProRes HQ",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "prores", "-profile", "hq", "-acodec", "pcm_s16le", "{{outfile}}-proreshq.mov"]
      },
      {
        "name": "DVD 16:9 m2v/ac3",
        "cmd": [
          ["ffmbc", "-i", "{{infile}}", "-acodec", "ac3", "-ab", "384k", "{{outfile}}-dvd.ac3"],
          ["ffmbc", "-i", "{{infile}}", "-target", "dvd", "-r", "29.97", "-aspect", "16:9", "-b", "6000k", "-an", "-vf", "yadif", "{{tempfile}}-dvdtemp.m2v"],
          ["ffmbc", "-i", "{{tempfile}}-dvdtemp.m2v", "-vcodec", "copy", "{{outfile}}-dvd.m2v"]
        ]
      },
      {
        "name": "1080p h.264 MP4",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "4M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=1920:1080", "-faststart", "auto", "{{outfile}}-1080p-h264.mov"]
      },
      {
        "name": "720p h.264 MP4",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "3M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=1280:720", "-faststart", "auto", "{{outfile}}-720p-h264.mov"]
      },
      {
        "name": "540p h.264 MP4",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "2M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=960:540", "-faststart", "auto", "{{outfile}}-540p-h264.mov"]
      },
      {
        "name": "360p h.264 MP4",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "1M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=640:360", "-faststart", "auto", "{{outfile}}-360p-h264.mp4"]
      },
      {
        "name": "MP4 wrapper with faststart",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-faststart", "auto", "-threads", "{{threads}}", "{{outfile}}.mp4"]
      },
      {
        "name": "MOV wrapper with faststart",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-faststart", "auto", "-threads", "{{threads}}", "{{outfile}}.mov"]
      },
      {
        "name": "MOV wrapper for C300",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-threads", "{{threads}}", "{{outfile}}.mov", "-acodec", "copy", "-newaudio"]
      },
      {
        "name": "DNxHD 175 1080p/23.976 MOV",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "dnxhd", "-vb", "175M", "-pix_fmt", "yuv422p", "-s", "1920x1080", "-r", "23.976", "-acodec", "pcm_s16le", "-ar", "48000", "-threads", "{{threads}}", "{{outfile}}-dnxhd175.mov"]
      },
      {
        "name": "MTS to MOV",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-an", "-threads", "{{threads}}", "{{outfile}}.mov"]
      }
    ]
  }
]
