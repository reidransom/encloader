// clang -fobjc-arc -framework Foundation -framework QTKit selfcontqt.m -o selfcontqt

#import <Foundation/foundation.h>
#import <QTKit/QTKit.h>

int main( int argc, const char* argv[])
{

	NSString				*srcPath;
	NSString				*outPath;
	QTMovie					*movie;
	NSMutableDictionary		*attributes;
	NSError					*error;

	@autoreleasepool {
		if (argc < 3) {
			printf("usage()\n");
		}
		else {

			NSFileManager *filemgr;
			NSString *currentpath;
			filemgr = [NSFileManager defaultManager];
			currentpath = [filemgr currentDirectoryPath];
			//NSLog(@"Current directory is %@", currentpath);

			srcPath = [NSString stringWithFormat:@"%s", argv[1]];
			unichar ch = [srcPath characterAtIndex:0];
			if (ch != '/') {
				srcPath = [NSString pathWithComponents:[NSArray arrayWithObjects:currentpath, srcPath, nil]];
			}

			outPath = [NSString stringWithFormat:@"%s", argv[2]];
			ch = [outPath characterAtIndex:0];
			if (ch != '/') {
				outPath = [NSString pathWithComponents:[NSArray arrayWithObjects:currentpath, outPath, nil]];
			}

			movie = [[QTMovie alloc] initWithFile:srcPath error:nil];

			if (movie == NULL) {
				//printf("File could not be loaded (%s).\n", argv[1]);
				NSLog(@"File could not be loaded: %@", srcPath);
				exit(1);
			}
			else {
				printf("Playing file (%s).\n", argv[1]);
				attributes = [NSMutableDictionary dictionaryWithCapacity:1];
				[attributes setObject:[NSNumber numberWithBool:YES] forKey:QTMovieFlatten];
				[movie writeToFile:outPath withAttributes:attributes error:nil];
			}
		}
	}

    return 0;

}