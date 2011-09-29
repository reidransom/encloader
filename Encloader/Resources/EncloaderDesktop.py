import sys
import os
import subprocess
import urllib2

from ftplib25 import FTP

#PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

import simplejson as json

LOCAL_ENCODERS = [
    {
        'id': 'iekJDI',
        'name': 'Web Post (HD)',
        'cmd': '%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 960 --height 540 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0',
        'extension': '.mp4',
    },
    {
        'id': '2IneI4',
        'name': 'Web Post (SD)',
        'cmd': '%(hb)s -i %(input_path)s -o %(output_path)s -e x264 -q 20.0 -E faac -B 128 -6 dpl2 -R Auto -D 0.0 -f mp4 --width 640 --height 480 --decomb --crop 0:0:0:0 --optimize -m -x cabac=0:ref=2:me=umh:bframes=0:weightp=0:subme=6:8x8dct=0:trellis=0',
        'extension': '.mp4',
    },
]

SOURCES = [
    #{
    #    'name': 'b2x',
    #    'url': 'http://b2x.local:8000/presets',
    #},
    {
        'name': 'reidransom.com',
        'url': 'http://dl.dropbox.com/u/1277748/encloader/presets.js',
    },
]


def get_sources():
    """ Returns a list of sources.
    """
    sources = []
    for source in SOURCES:
        try:
            f = urllib2.urlopen(source['url'])
            encode_presets = json.loads(f.read())
            f.close()
            presets.append({
                'name': source['name'],
                'presets': encode_presets,
            })
        except:
            pass
    return presets
    


def get_presets():
    """ Returns a list of encode_presets.
        This should return a tuple (encode_presets, upload_presets).
    """
    presets = [
        {
            'name': 'Local',
            'presets': LOCAL_ENCODERS,
        },
    ]
    for source in SOURCES:
        try:
            f = urllib2.urlopen(source['url'])
            encode_presets = json.loads(f.read())
            f.close()
            presets.append({
                'name': source['name'],
                'presets': encode_presets,
            })
        except:
            pass
    return presets

def encode(input_path, preset=LOCAL_ENCODERS[0], project_root=""):
    base_path = os.path.splitext(input_path)[0]
    output_path = base_path + preset['extension']
    i = 0
    while os.path.exists(output_path):
        i = i + 1
        output_path = '%s-%d%s' % (base_path, i, preset['extension'])
    input_path = "'%s'" % input_path
    output_path = "'%s'" % output_path
    hb = os.path.join(project_root, 'HandBrakeCLI')
    hb_cmd = preset['cmd'] % locals()
    os.system(hb_cmd)

def upload(x):
    
    infp = open(x.outfile.toString())
    
    log.debug(x.uploader.host)
    log.debug(x.uploader.user)
    log.debug(x.uploader.passwd)
    
    ftp = FTP(x.uploader.host, x.uploader.user, x.uploader.passwd)
    
    def storbincallback(buff):
        x.xfered = x.xfered + len(buff) - 1;
        x.upjob.set("percent", (x.xfered * 100) / x.filesize)
        x.upjob.render()
    
    ftp.storbinary(
        'STOR %s' % os.path.basename(x.outfile.toString()),
        infp, 1048576, storbincallback
    )
    
    x.upjob.set("percent", 100)
    x.upjob.set("state", "complete.")
    x.upjob.render()

    ftp.close()
    infp.close()

def get_filesize(path):
    return os.path.getsize(path)

def main(argv):
    preset = LOCAL_ENCODERS[0]
    for input_path in argv:
        encode(input_path, preset)

#if __name__ == "__main__":
#    main(sys.argv[1:])
