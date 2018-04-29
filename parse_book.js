const cheerio = require('cheerio')
const curl = require('curl');
const fs = require('fs');
//const util = require('util');
const SITE = 'https://www.wuxiaworld.com';
const NOVEL = 'warlock-of-the-magus-world';
const url = SITE + '/novel/' + NOVEL;
//rmji
//warlock-of-the-magus-world
//stellar-transformations
//martial-god-asura
//tales-of-demons-and-gods
let notLoadedBooks = [];
const createFile = (address, file)=>{
    return new Promise(resolve => {
        fs.writeFile(address, file, function(err) {
            if(err) {
                console.log('createFile',err);
            }
            resolve(err);
            //console.log("The file was saved!", address);
        }); 
    });
};

const getBody = (url)=>{
    return new Promise((resolve/* , reject */)=>{
        curl.get(SITE + url, (err, res, body)=>{
            if(err){
                //reject(err);
                console.log('geBody',err);
            }
            resolve(body, err);
        });
    });
};

function chunksCreate(arr, n) {
    var plen = Math.ceil(arr.length / n);
    return arr.reduce( function( p, c, i/*,  a */) {
      if(i%plen === 0) p.push([]);
      p[p.length-1].push(c);
      return p;
    }, []);
}
const chunkUpload = (chapters, id)=>{
    return new Promise(async res=>{
        console.log('chunk start',{uploads:0, length:chapters.length, id});
        const {uploads, length} = await new Promise( resolve =>{
            let uploads = 0;
            const recursUpload = async function fn(id){
                if( !chapters[id] ) {
                    resolve({uploads, length:chapters.length});
                    return
                }

                const {url,href} = chapters[id];
                const body = await getBody(url);
                const $ = cheerio.load(body);
                $('.panel.panel-default > div:first-child > .fr-view').find('a').each(function(){
                    let new_href = $(this).attr('href').slice(1) + '.html';
                    new_href = new_href.split('/')[2];
                    $(this).attr("href", new_href);  
                });
                const file = $('.panel.panel-default > div:first-child > .fr-view');
                const err = await createFile('dist/'+ href, file);
                if(!err){
                    uploads++;
                }else{
                    notLoadedBooks.push({...chapters[id], file, u:'dist/'+ href});
                }
                fn(id+1);
            };
            recursUpload(0);
        });
        
        console.log('chunk end', {uploads, length, id});
        res(uploads);
    });
};

const writeAll = async ( chapters )=>{
    console.log('write all start');
    const chunks = chunksCreate( chapters, 32);
    const toPromiseAll = chunks.map( (chap, id) => {
        return chunkUpload(chap, id)
    });
    await Promise.all(toPromiseAll);
    
    console.log('not loadedChapers', notLoadedBooks.length);
    notLoadedBooks.forEach(chapter=>{
        console.log(chapter.href);
    });
    let errIds = [];
    const load = async function fn(id,errIds){
        if(!notLoadedBooks[id]){
            const arr = [];
            errIds.forEach((e)=>{
                arr.push(notLoadedBooks[e]);
            });
            console.log({errIds});
            notLoadedBooks = arr;
            errIds = [];
            if(notLoadedBooks.length){
                fn(0, errIds);
            }
            return;
        }
        const {file, href} = notLoadedBooks[id]; 
        const err = await createFile('dist/'+ href, file);
        if(err){
           errIds.push(id);
        }
        fn(id+1, errIds);
    };
    load(0, errIds);
    console.log('write all end');
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
    
    toFile+=`<ul>\n`;
    chapters.forEach((chapter)=>{
        toFile += `\t<li><a href="${chapter.href}">${chapter.name}</a></li>\n`;
    });
    toFile += `</ul>`;
    await createFile(`dist/${NOVEL}.html`, toFile);
    
    writeAll(chapters);
     
});

