const curl = require('curl');

const download = (url)=>{
    return new Promise(resolve=>{
        curl.get(url, {}, async (err, response, body)=>{
            if(err){
                console.log(err);
                return;
            }
            resolve(body);
        });
    });
}

module.exports = download;