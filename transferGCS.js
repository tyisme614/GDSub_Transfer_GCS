const google_cloud_storage = require('@google-cloud/storage')({
	keyFilename: 'gcpkeyfile of source bucket'
});
const target_gcs = require('@google-cloud/storage')({
    keyFilename: 'gcpkeyfile of destination bucket'
});

const fs = require('fs');


var targetfiles = [];


const bucket = google_cloud_storage.bucket('source bucket name');
const target_bucket = target_gcs.bucket('target bucket name');

const cloud_dir = 'folder name';


const event_download_next = 7001;
const event_upload_next = 7002;

const eventEmitter = require('events');
class LocalEmitter extends eventEmitter{}

const eHandler = new LocalEmitter();

eHandler.on(event_download_next, (index) => {
    console.log('downloading file ' + targetfiles[index].name);
    download(index);
}); 

eHandler.on(event_upload_next, (index) => {
    console.log('uploading file ' + targetfiles[index].name);
    upload(index);
});

var options = {
	prefix: 'folder name/'
};
bucket.getFiles(options)
  .then(results => {
    targetfiles = results[0];
    download(1);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });

function download(index){
    var file = targetfiles[index];
    console.log('downloading file ' + file.name);
    var filename = file.name.split('/')[1];
    file.download({
        destination: __dirname + '/download/' + filename
    }, (err) => {
       if(err){
            console.log('encountered error while downloading file ' + filename + ' error:' + err);
       }else{
            console.log('downloaded file ' + filename);
            console.log('uploading file ' + filename);
	    eHandler.emit(event_upload_next, index);
                        
       }
        
    });
}

function upload(index){
	var fileobj = targetfiles[index];
	var filename = fileobj.name.split('/')[1];
	var options = {
        destination: cloud_dir + '/' + filename
    };
	var path = __dirname + '/download/' + filename;
	
  target_bucket.upload(path, options, function(err, file){
	if(err){
		console.log('encountered error while uploading file ' + filename + ', err:' + err);
	}else{
		console.log('file uploaded to target bucket, deleting downloaded file ' + filename);
      		fs.unlinkSync(__dirname + '/download/' + filename);
		var nextIndex = index + 1;
		console.log('next index:' + nextIndex)
            if( nextIndex < (targetfiles.length - 1)){
                eHandler.emit(event_download_next, nextIndex);  
            }else{
                console.log('all files have been processed, count:' + nextIndex);
            }

	}
  });
}
