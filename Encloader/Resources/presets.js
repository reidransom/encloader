[
    {
        "name": "Web Post (HD)",
        "cmd": "%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 960 --height 540 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0",
        "extension": ".mp4"
    },
    {
        "name": "Web Post (SD)",
        "cmd": "%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 640 --height 480 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0",
        "extension": ".mp4"
    }
]
