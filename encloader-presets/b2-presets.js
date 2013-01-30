[
  {
    "name": "My Presets",
    "presets": [
      {
        "id": "2K2l90",
        "type": "ENC",
        "name": "DVD 16:9 m2v/ac3",
        "cmd": [
          ["ffmbc", "-i", "{{infile}}", "-acodec", "ac3", "-ab", "384k", "{{outfile}}-dvd.ac3"],
          ["ffmbc", "-i", "{{infile}}", "-target", "dvd", "-r", "29.97", "-aspect", "16:9", "-b", "6000k", "-an", "-vf", "yadif", "{{tempfile}}-dvdtemp.m2v"],
          ["ffmbc", "-i", "{{tempfile}}-dvdtemp.m2v", "-vcodec", "copy", "{{outfile}}-dvd.m2v"]
        ]
      },
      {
        "id": "sL2n82",
        "type": "ENC",
        "name": "Sundance Digital Media",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "3M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=1280:720", "-faststart", "auto", "{{outfile}}-sundance-digital.mov"]
      },
      {
        "id": "sken02",
        "type": "ENC",
        "name": "B2 Web Post 16:9",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "1.5M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=640:360", "-faststart", "auto", "{{outfile}}-b2web.mp4"]
      },
      {
        "id": "sken82",
        "type": "ENC",
        "name": "540p x264 .mov w/deinterlace",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "3M", "-bf", "0", "-refs", "1", "-weightb", "0", "-8x8dct", "0", "-level", "30", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=960:540", "-faststart", "auto", "{{outfile}}-540p-deint.mov"]
      },
      {
        "id": "kw93k1",
        "type": "ENC",
        "name": "540p h264 mov",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "2M", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=960:540", "-faststart", "auto", "{{outfile}}-540p-h264.mov"]
      },
      {
        "id": "3kwph9",
        "type": "ENC",
        "name": "720p h264 mov",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-b", "3M", "-acodec", "libfaac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-aspect", "16:9", "-vf", "yadif,scale=1280:720", "-faststart", "auto", "{{outfile}}-720p-h264.mov"]
      },
      {
        "id": "wik83L",
        "type": "ENC",
        "name": ".mp4 wrapper with faststart",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-faststart", "auto", "-threads", "{{threads}}", "{{outfile}}.mp4"]
      },
      {
        "id": "ksu8rK",
        "type": "ENC",
        "name": ".mov wrapper with faststart",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-faststart", "auto", "-threads", "{{threads}}", "{{outfile}}.mov"]
      },
      {
        "id": "ksx8rK",
        "type": "ENC",
        "name": ".mov wrapper for C300 (use the 2nd audio channel)",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-map", "0:0", "-map", "0:2", "-ac", "1", "-threads", "{{threads}}", "{{outfile}}.mov"]
      },
      {
        "id": "29ke76",
        "type": "ENC",
        "name": ".mov wrapper for C300 (include both audio channels",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-acodec", "copy", "-threads", "{{threads}}", "{{outfile}}.mov", "-acodec", "copy", "-newaudio"]
      },
      {
        "id": "wodk38",
        "type": "ENC",
        "name": "DNxHD 175 MOV",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "dnxhd", "-vb", "175M", "-pix_fmt", "yuv422p", "-s", "1920x1080", "-r", "23.976", "-acodec", "pcm_s16le", "-ar", "48000", "-threads", "{{threads}}", "{{outfile}}-dnxhd175.mov"]
      },
      {
        "id": "w2dd38",
        "type": "ENC",
        "name": "MTS to MOV",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "copy", "-an", "-threads", "{{threads}}", "{{outfile}}.mov"]
      }
    ]
  }
]
