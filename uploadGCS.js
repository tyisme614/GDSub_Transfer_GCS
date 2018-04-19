const target_gcs = require('@google-cloud/storage')({
    keyFilename: 'gcpkeyfile of target google cloud service account'
});



const fs = require('fs');

const target_bucket = target_gcs.bucket('bucket name');

const cloud_dir = 'folder name';


const event_next = 7001;

const eventEmitter = require('events');
class LocalEmitter extends eventEmitter{}

const eHandler = new LocalEmitter();

eHandler.on(event_next, (index) => {
	console.log('uploading file ' + files[index]);
	upload(index);
}); 

var files = fs.readdirSync(__dirname + '/download');

console.log('starting data transfer');
upload(0);


function upload(index){
	var file = files[index];
	var options = {
        destination: cloud_dir + '/' + file
    };
	var path = __dirname + '/download/' + file;
	console.log('uploading file to gcs, file:' + file + ' index:' + index);
  target_bucket.upload(path, options, function(err, file){
	if(err){
		console.log('encountered error:'+ err);
		console.log('terminate.');
	}else{
		 console.log('file has been uploaded to target bucket, deleting downloaded file ' + file.name);
      		fs.unlinkSync(__dirname + '/download/' + files[index]);
      		console.log('start next. index:' + (index + 1));
      		eHandler.emit(index + 1);

	}
       });
}



