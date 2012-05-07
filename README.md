# Encloader

## Description

Encloader is an application that encodes and uploads video with minimal user
interaction.  It retreives settings from a user-defined set of URLs.  This 
allows for a team of editors to easily share the same encoding and uploading
settings.

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

## Downloads

* [Latest](http://api.appcelerator.net/p/pages/app_page?token=h4sjKZn5)
