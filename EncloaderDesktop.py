import sys
import os
import subprocess
import urllib2

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

try:
    import json
except ImportError:
    import simplejson as json

def main(argv):
    
    ENCODING_PRESETS = {
        '_web_post_sd' : {
            'name': 'Web Post (SD) local',
            'cmd': '%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 640 --height 480 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0',
            'extension': '.mp4',
        },
        '_web_post_hd': {
            'name': 'Web Post (HD) local',
            'cmd': '%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 960 --height 540 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0',
            'extension': '.mp4',
        },
    }

    try:
        f = urllib2.urlopen('http://b2x.local:8000/presets')
        ENCODING_PRESETS = json.loads(f.read())
        f.close()
    except:
        pass
    
    encoding_preset_keys = ENCODING_PRESETS.keys()
    cd_cmd = [os.path.join(PROJECT_ROOT, 'CocoaDialog.app/Contents/MacOS/CocoaDialog'), 'dropdown', '--text', '"Encoding preset:"', '--items'] + encoding_preset_keys + ['--button1', '"Encode!"', '--button2', 'Cancel']
    output = subprocess.Popen(cd_cmd, stdout=subprocess.PIPE).communicate()[0]
    (button, preset) = map(int, output.strip().split('\n'))
    
    if button != 1:
        sys.exit(0)
    
    preset = ENCODING_PRESETS[encoding_preset_keys[preset]]
    
    for input_path in argv:
        
        output_path = input_path + '.mp4'
        input_path = "'%s'" % input_path
        output_path = "'%s'" % output_path
        hb = os.path.join(PROJECT_ROOT, 'HandBrakeCLI')

        hb_cmd = preset['cmd'] % locals()
        os.system(hb_cmd)
    

if __name__ == "__main__":
    main(sys.argv[1:])
