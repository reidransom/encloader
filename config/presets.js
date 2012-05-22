[
  {
    "name": "My Presets",
    "presets": [
      {
        "id": "8kL3Jk",
        "type": "ENC",
        "name": "B2 Webpost HD",
        "cmd": [
          ["ffmpeg", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "26", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "192k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", "yadif,scale=640:360", "-threads", "{{threads}}", "{{outfile}}-b2hd.mp4"],
          ["qtfaststart.py", "{{outfile}}-b2hd.mp4"]
        ]
      },
      {
        "id": "4Jk91J",
        "type": "ENC",
        "name": "1080p h.264",
        "cmd": ["ffmpeg", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "22", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-ab", "256k", "-ac", "2", "-ar", "48k", "-strict", "experimental", "-vf", "yadif", "{{outfile}}-1080p-h264.mp4"]
      },
      {
        "id": "3jwQ90",
        "type": "ENC",
        "name": "B2 Screener",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "22", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-ab", "128k", "-ac", "2", "-ar", "48k", "-strict", "experimental", "-vf", "yadif,scale=640:360", "{{outfile}}-b2screener.mp4"]
      },
      {
        "id": "k8Ea24",
        "type": "ENC",
        "name": "B2 Webpost SD",
        "cmd": [
          ["ffmpeg", "-i", "{{infile}}", "-vcodec", "libx264", "-crf", "26", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "192k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", "yadif,scale=640:480", "-threads", "{{threads}}", "{{outfile}}-b2sd.mp4"],
          ["qtfaststart.py", "{{outfile}}-b2sd.mp4"]
        ]
      }
    ]
  }
]
