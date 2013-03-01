# Encloader

## Description

Encloader is an application that encodes and uploads video with minimal user
interaction.  It retreives settings from a user-defined set of URLs.  This 
allows for a team of editors to easily share the same encoding and uploading
settings.

[Download for OSX](http://s3.amazonaws.com/rr_media/encloader/Encloader.dmg)

<a href="http://mac.softpedia.com/get/Video/Encloader.shtml"><img src="http://mac.softpedia.com/base_img/softpedia_free_award_f.gif" alt="100% FREE award granted by Softpedia" /></a>

## Building

[TideSDK](http://www.tidesdk.org/)

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

## Todo:

Implement qtkit reading of files

* <https://gist.github.com/1321570>
* <http://svn.red-bean.com/pyobjc/trunk/pyobjc/pyobjc-framework-QTKit/PyObjCTest/test_qtkitdefines.py>
* <http://svn.akop.org/psp/trunk/vice/gfxoutputdrv/quicktimedrv.c>
