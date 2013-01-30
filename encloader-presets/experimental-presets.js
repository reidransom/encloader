        /*{
          "id": "zIs82L",
          "type": "ENC",
          "name": "5D to DNx175 MXF",
          "cmd": [
            ["ffmpeg", "-i", "{{infile}}", "-vcodec", "dnxhd", "-b:v", "175M", "-pix_fmt", "yuv422p", "-s", "1920x1080", "-acodec", "pcm_s16le", "-ar", "48000", "-ac", "2", "-threads", "{{threads}}", "-vf", "crop=in_w:in_h-8:0:0,scale=1920:1080", "{{tempfile}}.mov"],
            ["ffmpeg", "-i", "{{tempfile}}.mov", "-an", "-vcodec", "copy", "{{tempfile}}.m2v"],
            ["ffmpeg", "-i", "{{tempfile}}.mov", "-vn", "-acodec", "pcm_s16le", "{{tempfile}}.wav"],
            ["writeavidmxf", "--prefix", "{{outfile}}", "--film23.976", "--DNxHD1080p175", "{{tempfile}}.m2v", "--wavpcm", "{{tempfile}}.wav"]
          ],
        }*/
