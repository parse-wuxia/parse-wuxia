const cheerio = require('cheerio')
const curl = require('curl');
const fs = require('fs');
const util = require('util');
const SITE = 'https://www.wuxiaworld.com';
const NOVEL = 'tales-of-demons-and-gods';
const url = SITE + '/novel/' + NOVEL;
//rmji
//warlock-of-the-magus-world
//stellar-transformations
//martial-god-asura
//tales-of-demons-and-gods
const createFile = (address, file)=>{
    return new Promise(resolve => {
        fs.writeFile(address, file, function(err) {
            if(err) {
                return console.log(err);
            }
            resolve();
            console.log("The file was saved!", address);
        }); 
    });
};

const getBody = (url)=>{
    return new Promise((resolve, reject)=>{
        curl.get(SITE + url, (err, res, body)=>{
            if(err){
                reject(err);
                console.log(err);
            }
            resolve(body, err);
        });
    });
};

function chunksCreate(arr, n) {
    var plen = Math.ceil(arr.length / n);
    return arr.reduce( function( p, c, i, a) {
      if(i%plen === 0) p.push([]);
      p[p.length-1].push(c);
      return p;
    }, []);
}
const chunkUpload = (chapters)=>{
    let uploads = 0;
    const recursUpload = async function fn(id){
        if(uploads === chapters.lenght) return
        if( !chapters[id] ) return

        const {url,href} = chapters[id];
        const body = await getBody(url);
        const $ = cheerio.load(body);
        $('.panel.panel-default > div:first-child > .fr-view').find('a').each(function(){
            let new_href = $(this).attr('href').slice(1) + '.html';
            new_href = new_href.split('/')[2];
            $(this).attr("href", new_href);  
        });
        const file = $('.panel.panel-default > div:first-child > .fr-view');
        await createFile('dist/'+ href, file);
        uploads++;
        fn(id+1);
    };
    recursUpload(0);
    return uploads;
};
const writeAll = async ( chapters )=>{
    console.log('WriteALL start');
    const chunks = chunksCreate( chapters, 30);
    let uploads = 0;
    await new Promise(resolve=>{
            chunks.forEach( (chap, id) => {
            uploads += chunkUpload(chap);
            if(id === 4) resolve(); 
        });
    })
    console.log(uploads);
}
const dir = 'dist/novel/' + NOVEL;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

curl.get(url, {}, async (err, response, body)=> {
    if(err){
        console.log(err);
        return;
    }
    //console.log(response);
    const $ = cheerio.load(body);
    const chapters = [];
    let toFile = '';
    $('.panel-body').find('.chapter-item a').each((id, e)=>{
        //if(id === 1) console.log(e);
        chapters[id] ={
            name: e.children.find(e=> e.name === 'span').children[0].data,
            href:e.attribs.href.slice(1) + '.html',
            url:e.attribs.href
        };
    });

    //console.log(chapters[0].href.split('/'));
    chapters.forEach((chapter)=>{
        toFile += `<a href="${chapter.href}">${chapter.name}</a>\n`;
    });
    
    await createFile(`dist/${NOVEL}.html`, toFile);
    
    writeAll(chapters);
     
});

