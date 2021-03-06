const fs = require('fs');

const createFile = (address, file)=>{
    return new Promise(resolve => {
        fs.writeFile(address, file, function(err) {
            if(err) {
                //console.log('createFile',err);
                resolve(err);
                return;
            }
            resolve();
            //console.log("The file was saved!", address);
        }); 
    });
};
const readFile = (src)=>{
    return new Promise(resolve => {
        fs.readFile(src, 'utf8', function(err, contents) {
            if(err) {
                console.log('readFile',err);
            }
            resolve(contents);
        });
    });
};
module.exports = { createFile, readFile };