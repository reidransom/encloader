[
  {
    "name": "Example Presets",
    "presets": [
      {
        "id": "ekn39s",
        "type": "ENC",
        "name": "Online H.264",
        "cmd": ["ffmpeg", "-i", "{{infile}}", "-threads", "{{threads}}", "-vcodec", "libx264", "-coder", "0", "-flags", "-loop", "-cmp", "+chroma", "-partitions", "-parti8x8-parti4x4-partp8x8-partb8x8", "-me_method", "dia", "-subq", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "0", "-i_qfactor", "0.71", "-b_strategy", "0", "-qcomp", "0.6", "-qmin", "10", "-qmax", "51", "-qdiff", "4", "-bf", "0", "-refs", "1", "-directpred", "1", "-trellis", "0", "-flags2", "-bpyramid-mixed_refs-wpred-dct8x8+fastpskip-mbtree", "-wpredp", "0", "-acodec", "aac", "-ac", "2", "-b:a", "256k", "-r:a", "48k", "-strict", "experimental", "-vf", "yadif,scale=1024:576", "{{outfile}}-online.mov"]
      },
      {
        "id": "3KuI82",
        "type": "ENC",
        "name": "Screener",
        "cmd": ["ffmbc", "-i", "{{infile}}", "-threads", "{{threads}}", "-vcodec", "libx264", "-coder", "0", "-flags", "-loop", "-cmp", "+chroma", "-partitions", "-parti8x8-parti4x4-partp8x8-partb8x8", "-me_method", "dia", "-subq", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "0", "-i_qfactor", "0.71", "-b_strategy", "0", "-qcomp", "0.6", "-qmin", "10", "-qmax", "51", "-qdiff", "4", "-bf", "0", "-refs", "1", "-trellis", "0", "-wpredp", "0", "-acodec", "libfaac", "-ac", "2", "-ab", "128k", "-ar", "48k", "-strict", "experimental", "-vf", "yadif,scale=640:360", "{{outfile}}-screener.mov"]
      },
      {
        "id": "k8Ea25",
        "type": "ENC",
        "name": "Webpost HD",
        "cmd": [
          ["ffmpeg", "-i", "{{infile}}", "-crf", "26", "-flags", "+loop+mv4", "-cmp", "256", "-partitions", "+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8", "-me_method", "hex", "-subq", "7", "-trellis", "1", "-refs", "5", "-bf", "0", "-flags2", "+mixed_refs", "-coder", "0", "-me_range", "16", "-g", "250", "-keyint_min", "25", "-sc_threshold", "40", "-i_qfactor", "0.71", "-qmin", "10", "-qmax", "51", "-acodec", "aac", "-b:a", "192k", "-ac", "2", "-r:a", "48k", "-strict", "experimental", "-vf", "yadif,scale=960:540", "-threads", "{{threads}}", "{{outfile}}.mp4"],
          ["qtfaststart.py", "{{outfile}}.mp4"]
        ]
      }
    ]
  }
]
