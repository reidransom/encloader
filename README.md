# Encloader

## Description

Encloader is an application that encodes and uploads video with minimal user
interaction.  It retreives settings from a user-defined set of URLs.  This 
allows for a team of editors to easily share the same encoding and uploading
settings.

[Download](https://github.com/reidransom/encloader/downloads)

<a href="http://mac.softpedia.com/get/Video/Encloader.shtml"><img src="http://mac.softpedia.com/base_img/softpedia_free_award_f.gif" alt="100% FREE award granted by Softpedia" /></a>

## Building

See [Packaging Titanium Apps on Your Own](http://developer.appcelerator.com/doc/desktop/packaging).

Example:
  
    /Library/Application Support/Titanium/sdk/osx/1.2.0.RC4/tibuild.py -r -d ~/Desktop -t bundle encloader/Encloader

## Avid Codec Support

* Supported
  * DNxHD
  * ProRes
  * DVCProHD
  * MPEG
  * DV

* Unsupported
  * XDCAM
  * AVC-Intra
  * 1:1 HD
  * 20:1, 14:1, etc.

Todo:

Implement qtkit reading of files

* <https://gist.github.com/1321570>
* <http://svn.red-bean.com/pyobjc/trunk/pyobjc/pyobjc-framework-QTKit/PyObjCTest/test_qtkitdefines.py>
* <http://svn.akop.org/psp/trunk/vice/gfxoutputdrv/quicktimedrv.c>
